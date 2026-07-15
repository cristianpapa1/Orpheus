import { createServerSupabase } from "@/lib/supabase/server";
import type { GroupRelation } from "./types";

export interface GroupMessage {
  id: string;
  author_id: string;
  author_handle: string;
  author_name: string;
  author_avatar_url: string | null;
  title: string | null;
  body: string;
  created_at: string;
}

/** A discussion in the board list — the opening message plus rollups. */
export interface GroupThreadSummary {
  id: string;
  author_id: string;
  author_handle: string;
  author_name: string;
  author_avatar_url: string | null;
  title: string | null;
  body: string;
  created_at: string;
  reply_count: number;
  last_activity: string;
}

/** A discussion opened on its own page — opening message + all replies. */
export interface GroupThreadDetail {
  thread: GroupMessage;
  replies: GroupMessage[];
}

// group_messages has TWO FKs to profiles (author_id + removed_by) — pin the embed.
// WITH carries the 0025 title column; BASE is the pre-0025 fallback so existing
// threads keep rendering during the deploy window before the migration lands.
const AUTHOR = "author:profiles!group_messages_author_id_fkey(handle, display_name, avatar_url)";
const SELECT_WITH = `id, title, author_id, parent_id, body, created_at, ${AUTHOR}`;
const SELECT_BASE = `id, author_id, parent_id, body, created_at, ${AUTHOR}`;

type AuthorEmbed = {
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
};
type MsgRow = {
  id: string;
  author_id: string;
  parent_id: string | null;
  title?: string | null;
  body: string;
  created_at: string;
  author: AuthorEmbed | AuthorEmbed[] | null;
};

function toMessage(r: MsgRow): GroupMessage & { parent_id: string | null } {
  const a = Array.isArray(r.author) ? (r.author[0] ?? null) : r.author;
  return {
    id: r.id,
    author_id: r.author_id,
    author_handle: a?.handle ?? "",
    author_name: a?.display_name ?? a?.handle ?? "Unnamed",
    author_avatar_url: a?.avatar_url ?? null,
    title: r.title ?? null,
    body: r.body,
    created_at: r.created_at,
    parent_id: r.parent_id,
  };
}

type Client = NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Select group messages, degrading to the pre-title column set if 0025 hasn't
 *  been applied yet. Returns null on a hard failure (missing table, etc.). */
async function selectMessages(
  supabase: Client,
  apply: (q: ReturnType<ReturnType<Client["from"]>["select"]>) => unknown,
): Promise<MsgRow[] | null> {
  const withRes = await (apply(supabase.from("group_messages").select(SELECT_WITH)) as Promise<{
    data: unknown;
    error: unknown;
  }>);
  if (!withRes.error && withRes.data) return withRes.data as MsgRow[];
  // title column absent (or another shape error) → retry without it.
  const baseRes = await (apply(supabase.from("group_messages").select(SELECT_BASE)) as Promise<{
    data: unknown;
    error: unknown;
  }>);
  if (baseRes.error || !baseRes.data) return null;
  return baseRes.data as MsgRow[];
}

/**
 * The group's discussions as board summaries: one row per top-level thread with
 * its reply count and last-activity time, most-recently-active first. Defensive —
 * returns [] if the 0024 table isn't there yet. RLS enforces read access.
 */
export async function getGroupThreads(groupId: string): Promise<GroupThreadSummary[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const rows = await selectMessages(supabase, (q) =>
    q.eq("group_id", groupId).is("removed_at", null).limit(500),
  );
  if (!rows) return [];

  const msgs = rows.map(toMessage);
  const agg = new Map<string, { count: number; last: string }>();
  for (const m of msgs) {
    if (!m.parent_id) continue;
    const cur = agg.get(m.parent_id) ?? { count: 0, last: "" };
    cur.count += 1;
    if (m.created_at > cur.last) cur.last = m.created_at;
    agg.set(m.parent_id, cur);
  }

  return msgs
    .filter((m) => !m.parent_id)
    .map((t) => {
      const a = agg.get(t.id);
      const lastReply = a?.last ?? "";
      return {
        id: t.id,
        author_id: t.author_id,
        author_handle: t.author_handle,
        author_name: t.author_name,
        author_avatar_url: t.author_avatar_url,
        title: t.title,
        body: t.body,
        created_at: t.created_at,
        reply_count: a?.count ?? 0,
        last_activity: lastReply > t.created_at ? lastReply : t.created_at,
      };
    })
    .sort((x, y) => y.last_activity.localeCompare(x.last_activity));
}

/**
 * A single discussion for its own page: the opening message plus every reply
 * (oldest first). Returns null if the thread doesn't exist or isn't readable.
 */
export async function getGroupThread(
  groupId: string,
  threadId: string,
): Promise<GroupThreadDetail | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  // threadId reaches the .or() filter as a string, so reject anything that isn't
  // a UUID before it touches the query — garbage route params can't inject.
  if (!UUID_RE.test(threadId)) return null;
  // The opening message and its replies in one read, scoped to the group and
  // not removed, oldest-first.
  const rows = await selectMessages(supabase, (q) =>
    q
      .eq("group_id", groupId)
      .is("removed_at", null)
      .or(`id.eq.${threadId},parent_id.eq.${threadId}`)
      .order("created_at", { ascending: true }),
  );
  if (!rows) return null;

  const msgs = rows.map(toMessage);
  const opening = msgs.find((m) => m.id === threadId && !m.parent_id);
  if (!opening) return null;
  const replies = msgs.filter((m) => m.parent_id === threadId);
  return { thread: opening, replies };
}

export interface DiscussionAccess {
  canRead: boolean;
  canPostTop: boolean;
  canReply: boolean;
  label: string;
}

/** Resolve what a viewer may do in a group's discussion from its settings +
 *  the viewer's relationship to the group. */
export function discussionAccess(
  read: string,
  mode: string,
  relation: GroupRelation,
): DiscussionAccess {
  const isMember = relation === "owner" || relation === "member";
  const isOwner = relation === "owner";
  return {
    canRead: read === "public" || isMember,
    canPostTop: isOwner || (isMember && mode === "open"),
    canReply: isOwner || (isMember && (mode === "open" || mode === "announce")),
    label:
      mode === "open"
        ? "Open discussion — members post and reply"
        : mode === "announce"
          ? "Announcements — owners post, members reply"
          : "Announcements — owners post only",
  };
}
