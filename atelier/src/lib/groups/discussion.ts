import { createServerSupabase } from "@/lib/supabase/server";
import type { GroupRelation } from "./types";

export interface GroupMessage {
  id: string;
  author_id: string;
  author_handle: string;
  author_name: string;
  author_avatar_url: string | null;
  body: string;
  created_at: string;
}

export interface GroupThread extends GroupMessage {
  replies: GroupMessage[];
}

// group_messages has TWO FKs to profiles (author_id + removed_by) — pin the embed.
const MSG_SELECT =
  "id, author_id, parent_id, body, created_at, author:profiles!group_messages_author_id_fkey(handle, display_name, avatar_url)";

type AuthorEmbed = {
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
};
type MsgRow = {
  id: string;
  author_id: string;
  parent_id: string | null;
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
    body: r.body,
    created_at: r.created_at,
    parent_id: r.parent_id,
  };
}

/**
 * The group's discussion as threads: top-level messages (newest first), each
 * with its replies (oldest first). Defensive — returns [] if the 0024 table
 * isn't there yet. RLS already enforces read access.
 */
export async function getGroupDiscussion(groupId: string): Promise<GroupThread[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("group_messages")
    .select(MSG_SELECT)
    .eq("group_id", groupId)
    .is("removed_at", null)
    .order("created_at", { ascending: true })
    .limit(300);
  if (error || !data) return [];

  const rows = (data as unknown as MsgRow[]).map(toMessage);
  const repliesByParent = new Map<string, GroupMessage[]>();
  for (const r of rows) {
    if (r.parent_id) {
      const arr = repliesByParent.get(r.parent_id) ?? [];
      arr.push(r);
      repliesByParent.set(r.parent_id, arr);
    }
  }
  return rows
    .filter((r) => !r.parent_id)
    .map((t) => ({ ...t, replies: repliesByParent.get(t.id) ?? [] }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
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
