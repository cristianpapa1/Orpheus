import { createServerSupabase } from "@/lib/supabase/server";

export interface CommentItem {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_handle: string;
  author_name: string;
}

/** Comments on a post, oldest first. Defensive: [] pre-migration / preview. */
export async function getComments(postId: string): Promise<CommentItem[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("post_comments")
    // Explicit FK: since 0028's comment_supports also links post_comments↔profiles,
    // a bare `profiles` embed is ambiguous (PGRST201) and silently returned []. Pin
    // the author relationship so comments actually load.
    .select("id, body, created_at, author_id, author:profiles!post_comments_author_id_fkey(handle, display_name)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error || !data) return [];
  return (data as unknown as {
    id: string;
    body: string;
    created_at: string;
    author_id: string;
    author: { handle: string | null; display_name: string | null } | null;
  }[]).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    author_id: c.author_id,
    author_handle: c.author?.handle ?? "",
    author_name: c.author?.display_name ?? c.author?.handle ?? "Unnamed",
  }));
}

export interface SupportInfo {
  count: number;
  mine: boolean;
}

/**
 * Support (like) counts per comment + whether the viewer supported each.
 * Returns null when unavailable (preview / 0028 not applied) so callers hide
 * the support UI. Mirrors the favorites pattern.
 */
export async function getCommentSupports(
  commentIds: string[],
): Promise<Map<string, SupportInfo> | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  if (commentIds.length === 0) return new Map();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("comment_supports")
    .select("comment_id, profile_id")
    .in("comment_id", commentIds);
  if (error) return null; // table missing → feature off

  const map = new Map<string, SupportInfo>();
  for (const id of commentIds) map.set(id, { count: 0, mine: false });
  for (const r of data ?? []) {
    const e = map.get(r.comment_id);
    if (!e) continue;
    e.count += 1;
    if (user && r.profile_id === user.id) e.mine = true;
  }
  return map;
}
