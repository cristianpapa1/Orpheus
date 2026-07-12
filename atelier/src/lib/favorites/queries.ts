import { createServerSupabase } from "@/lib/supabase/server";
import type { Post } from "@atelier/core/posts/types";

export interface FavInfo {
  count: number;
  mine: boolean;
}

/**
 * Favorite counts + whether the viewer favorited each post. Returns null when
 * the feature is unavailable (preview, or the 0016 table not yet applied) so
 * callers can simply hide the favorite UI — never breaking the feed.
 */
export async function getFavoritesForPosts(
  postIds: string[],
): Promise<Map<string, FavInfo> | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  if (postIds.length === 0) return new Map();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("post_favorites")
    .select("post_id, profile_id")
    .in("post_id", postIds);
  if (error) return null; // table missing → feature off

  const map = new Map<string, FavInfo>();
  for (const id of postIds) map.set(id, { count: 0, mine: false });
  for (const r of data ?? []) {
    const e = map.get(r.post_id);
    if (!e) continue;
    e.count += 1;
    if (user && r.profile_id === user.id) e.mine = true;
  }
  return map;
}

/** Posts the signed-in viewer has favorited, newest-favorited first. */
export async function getSavedPosts(limit = 50): Promise<Post[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("post_favorites")
    .select("post_id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data || data.length === 0) return [];

  const ids = data.map((r) => r.post_id);
  const { getPostsByIds } = await import("@/lib/posts/queries");
  const posts = await getPostsByIds(ids, limit);
  // Preserve favorite order (getPostsByIds re-sorts by created_at).
  const order = new Map(ids.map((id, i) => [id, i]));
  return posts.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
