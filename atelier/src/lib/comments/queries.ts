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
    .select("id, body, created_at, author_id, author:profiles(handle, display_name)")
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
