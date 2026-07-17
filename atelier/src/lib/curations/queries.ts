import { createServerSupabase } from "@/lib/supabase/server";
import type { Post } from "@atelier/core/posts/types";

export interface CurationInfo {
  count: number;
  mine: boolean;
}

/**
 * Curation counts + whether the viewer curated each post. Mirrors the favorites
 * pattern. Returns null when the feature is unavailable (preview, or the 0027
 * table not yet applied) so callers just hide the curated UI.
 */
export async function getCurationsForPosts(
  postIds: string[],
): Promise<Map<string, CurationInfo> | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  if (postIds.length === 0) return new Map();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("post_curations")
    .select("post_id, curator_id")
    .in("post_id", postIds);
  if (error) return null; // table missing → feature off

  const map = new Map<string, CurationInfo>();
  for (const id of postIds) map.set(id, { count: 0, mine: false });
  for (const r of data ?? []) {
    const e = map.get(r.post_id);
    if (!e) continue;
    e.count += 1;
    if (user && r.curator_id === user.id) e.mine = true;
  }
  return map;
}

interface CurationRow {
  post_id: string;
  curator_id: string;
  created_at: string;
  store_url: string | null;
}

/**
 * Read curation rows, tolerating the 0028 `store_url` column being absent
 * (pre-migration) — falls back to base columns with store_url = null. Returns
 * null on a genuine failure / missing table.
 */
async function readCurations(
  eqColumn: "post_id" | "curator_id",
  value: string,
  limit: number,
): Promise<CurationRow[] | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const withStore = await supabase
    .from("post_curations")
    .select("post_id, curator_id, created_at, store_url")
    .eq(eqColumn, value)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!withStore.error) return (withStore.data ?? []) as CurationRow[];

  const base = await supabase
    .from("post_curations")
    .select("post_id, curator_id, created_at")
    .eq(eqColumn, value)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (base.error || !base.data) return null;
  return base.data.map((r) => ({ ...r, store_url: null })) as CurationRow[];
}

export interface Curator {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  /** The curator's optional Astelier buy link for this pick. */
  store_url: string | null;
}

/** Who curated a given post — for the "Curated by" inspector. Defensive → []. */
export async function getCuratorsForPost(postId: string, limit = 50): Promise<Curator[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const rows = await readCurations("post_id", postId, limit);
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((r) => r.curator_id);
  const storeById = new Map(rows.map((r) => [r.curator_id, r.store_url]));
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url")
    .in("id", ids);
  const byId = new Map(
    (profs ?? []).map((p) => [
      p.id,
      {
        id: p.id,
        handle: p.handle ?? "",
        display_name: p.display_name ?? p.handle ?? "Unnamed",
        avatar_url: p.avatar_url ?? null,
        store_url: storeById.get(p.id) ?? null,
      } as Curator,
    ]),
  );
  return ids.map((id) => byId.get(id)).filter((c): c is Curator => Boolean(c));
}

export interface CuratedPick {
  post: Post;
  storeUrl: string | null;
}

/** Posts a curator has curated, newest-curated first — their "Curated" shelf. */
export async function getCuratedByProfile(
  curatorId: string,
  limit = 50,
): Promise<CuratedPick[]> {
  const rows = await readCurations("curator_id", curatorId, limit);
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((r) => r.post_id);
  const storeByPost = new Map(rows.map((r) => [r.post_id, r.store_url]));
  const { getPostsByIds } = await import("@/lib/posts/queries");
  const posts = await getPostsByIds(ids, limit);
  const order = new Map(ids.map((id, i) => [id, i]));
  return posts
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((post) => ({ post, storeUrl: storeByPost.get(post.id) ?? null }));
}
