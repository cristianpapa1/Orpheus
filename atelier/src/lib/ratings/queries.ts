import { createServerSupabase } from "@/lib/supabase/server";

/**
 * A profile's star ratings (1–5) for a set of posts — used on the favorites
 * gallery. Ratings are public (part of a member's displayed taste). Returns an
 * empty map when unavailable (preview, or 0027 not applied) so the gallery just
 * shows unrated.
 */
export async function getRatingsForPosts(
  profileId: string,
  postIds: string[],
): Promise<Map<string, number>> {
  const supabase = await createServerSupabase();
  const empty = new Map<string, number>();
  if (!supabase || postIds.length === 0) return empty;

  const { data, error } = await supabase
    .from("post_ratings")
    .select("post_id, stars")
    .eq("profile_id", profileId)
    .in("post_id", postIds);
  if (error || !data) return empty;

  const map = new Map<string, number>();
  for (const r of data) map.set(r.post_id, Number(r.stars));
  return map;
}
