import { SUPABASE_URL } from "@/lib/supabase/config";
import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_POSTS } from "./demo";
import { parseDisplay } from "@atelier/core/posts/display";
import {
  isMediaType,
  isPostCategory,
  parseVariantPaths,
  type Post,
} from "@atelier/core/posts/types";

/* Server-side post reads. Preview mode (no Supabase) serves demo posts.
   Ordering is created_at DESC only — chronological by principle; there is
   no score, weight, or ranking of any kind (ISA anti-criterion ISC-108). */

// The author embed MUST name the FK explicitly: post_mentions added a second
// posts↔profiles relationship, so the implicit embed is ambiguous (PostgREST
// "more than one relationship" error) and would break every post read.
const POST_SELECT =
  "id, author_id, caption, category, subcategory, body, tags, image_path, image_width, image_height, original_path, variants, blur_data, alt_text, media_type, media_path, duration_seconds, display, created_at, author:profiles!posts_author_id_fkey(handle, display_name, avatar_url)";

type PostRow = {
  id: string;
  author_id: string;
  caption: string;
  category: string;
  subcategory: string | null;
  body: string | null;
  tags: string[] | null;
  image_path: string | null;
  image_width: number | null;
  image_height: number | null;
  original_path: string | null;
  variants: unknown;
  blur_data: string | null;
  alt_text: string | null;
  media_type: string | null;
  media_path: string | null;
  duration_seconds: number | null;
  display: unknown;
  created_at: string;
  author: {
    handle: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
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
    author_avatar_url: row.author?.avatar_url ?? null,
    caption: row.caption,
    category: row.category,
    subcategory: row.subcategory,
    body: row.body,
    tags: row.tags ?? [],
    image_url: row.image_path ? publicMediaUrl(row.image_path) : "",
    image_width: row.image_width,
    image_height: row.image_height,
    original_url: row.original_path ? publicMediaUrl(row.original_path) : null,
    variants: parseVariantPaths(row.variants, publicMediaUrl),
    blur_data: row.blur_data,
    alt_text: row.alt_text,
    media_type: isMediaType(row.media_type) ? row.media_type : "image",
    media_url: row.media_path ? publicMediaUrl(row.media_path) : null,
    duration_seconds: row.duration_seconds,
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

  const [{ data: followRows }, { data: blockRows }] = await Promise.all([
    supabase.from("follows").select("followee_id").eq("follower_id", user.id),
    supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
  ]);

  // Blocked creators never reach the feed, even if still followed.
  const blocked = new Set((blockRows ?? []).map((b) => b.blocked_id));
  const authorIds = [
    user.id,
    ...(followRows ?? []).map((r) => r.followee_id),
  ].filter((id) => !blocked.has(id));

  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .in("author_id", authorIds)
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as PostRow[])
    .map(toPost)
    .filter((p): p is Post => p !== null);
}

/** All recent posts across every author, newest first (admin console). */
export async function getRecentPosts(limit = 50): Promise<Post[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [...DEMO_POSTS].sort(byNewest).slice(0, limit);
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .is("removed_at", null)
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
    .is("removed_at", null)
    .maybeSingle();
  return data ? toPost(data as unknown as PostRow) : null;
}

/** Fetch specific posts by id, newest first (group feeds). */
export async function getPostsByIds(
  ids: string[],
  limit = 30,
): Promise<Post[]> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return DEMO_POSTS.filter((p) => ids.includes(p.id))
      .sort(byNewest)
      .slice(0, limit);
  }
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .in("id", ids)
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as PostRow[])
    .map(toPost)
    .filter((p): p is Post => p !== null);
}

export interface PostMention {
  id: string;
  handle: string;
  display_name: string;
}

/** People tagged on a post (mutual follows at publish time). */
export async function getPostMentions(postId: string): Promise<PostMention[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("post_mentions")
    .select("mentioned_id, profile:profiles(handle, display_name)")
    .eq("post_id", postId);
  return ((data ?? []) as unknown as {
    mentioned_id: string;
    profile: { handle: string | null; display_name: string | null } | null;
  }[]).map((m) => ({
    id: m.mentioned_id,
    handle: m.profile?.handle ?? "",
    display_name: m.profile?.display_name ?? m.profile?.handle ?? "Unnamed",
  }));
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
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as PostRow[])
    .map(toPost)
    .filter((p): p is Post => p !== null);
}

/** Live posts carrying a given topic tag, newest first (/t/<tag>). */
export async function getPostsByTag(tag: string, limit = 40): Promise<Post[]> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return DEMO_POSTS.filter((p) => p.tags.includes(tag)).sort(byNewest).slice(0, limit);
  }
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .contains("tags", [tag])
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as PostRow[])
    .map(toPost)
    .filter((p): p is Post => p !== null);
}

/** Posts an admin has removed (soft-deleted), newest first. Admin console. */
export async function getRemovedPosts(limit = 50): Promise<Post[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .not("removed_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return ((data ?? []) as unknown as PostRow[])
    .map(toPost)
    .filter((p): p is Post => p !== null);
}
