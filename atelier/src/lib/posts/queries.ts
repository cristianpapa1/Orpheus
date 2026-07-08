import { SUPABASE_URL } from "@/lib/supabase/config";
import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_POSTS } from "./demo";
import { parseDisplay } from "./display";
import { isPostCategory, parseVariantPaths, type Post } from "./types";

/* Server-side post reads. Preview mode (no Supabase) serves demo posts.
   Ordering is created_at DESC only — chronological by principle; there is
   no score, weight, or ranking of any kind (ISA anti-criterion ISC-108). */

const POST_SELECT =
  "id, author_id, caption, category, image_path, image_width, image_height, original_path, variants, blur_data, display, created_at, author:profiles(handle, display_name)";

type PostRow = {
  id: string;
  author_id: string;
  caption: string;
  category: string;
  image_path: string;
  image_width: number | null;
  image_height: number | null;
  original_path: string | null;
  variants: unknown;
  blur_data: string | null;
  display: unknown;
  created_at: string;
  author: { handle: string | null; display_name: string | null } | null;
};

export function publicMediaUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}

function toPost(row: PostRow): Post | null {
  if (!isPostCategory(row.category)) return null;
  return {
    id: row.id,
    author_id: row.author_id,
    author_handle: row.author?.handle ?? "",
    author_name: row.author?.display_name ?? row.author?.handle ?? "Unnamed",
    caption: row.caption,
    category: row.category,
    image_url: publicMediaUrl(row.image_path),
    image_width: row.image_width,
    image_height: row.image_height,
    original_url: row.original_path ? publicMediaUrl(row.original_path) : null,
    variants: parseVariantPaths(row.variants, publicMediaUrl),
    blur_data: row.blur_data,
    display: parseDisplay(row.display),
    created_at: row.created_at,
  };
}

const byNewest = (a: Post, b: Post) =>
  b.created_at.localeCompare(a.created_at);

/** Chronological feed: the viewer's follows + their own posts. */
export async function getFeedPosts(limit = 30): Promise<Post[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [...DEMO_POSTS].sort(byNewest).slice(0, limit);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: followRows } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", user.id);

  const authorIds = [user.id, ...(followRows ?? []).map((r) => r.followee_id)];

  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .in("author_id", authorIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as PostRow[])
    .map(toPost)
    .filter((p): p is Post => p !== null);
}

export async function getPostById(id: string): Promise<Post | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return DEMO_POSTS.find((p) => p.id === id) ?? null;

  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();
  return data ? toPost(data as unknown as PostRow) : null;
}

export async function getPostsByAuthor(
  authorId: string,
  limit = 6,
): Promise<Post[]> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return DEMO_POSTS.filter((p) => p.author_id === authorId)
      .sort(byNewest)
      .slice(0, limit);
  }

  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as PostRow[])
    .map(toPost)
    .filter((p): p is Post => p !== null);
}
