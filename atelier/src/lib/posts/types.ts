import { DEFAULT_DISPLAY, type PostDisplay } from "./display";

export const POST_CATEGORIES = [
  "art",
  "handmade",
  "photography",
  "music",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<PostCategory, string> = {
  art: "Art",
  handmade: "Handmade",
  photography: "Photography",
  music: "Music",
};

export interface PostVariant {
  width: number;
  url: string;
}

export interface Post {
  id: string;
  author_id: string;
  author_handle: string;
  author_name: string;
  caption: string;
  category: PostCategory;
  image_url: string;
  image_width: number | null;
  image_height: number | null;
  /** Untouched full-resolution original, when the author uploaded one. */
  original_url: string | null;
  /** Optimized display sizes, ascending by width. */
  variants: PostVariant[];
  /** Tiny inline blur-up placeholder (data URI). */
  blur_data: string | null;
  display: PostDisplay;
  created_at: string; // ISO-8601
}

export { DEFAULT_DISPLAY };

/** Smallest display variant — for thumbnails (gallery blocks). */
export function thumbUrl(post: Post): string {
  return post.variants[0]?.url ?? post.image_url;
}

/** Validate a variants list (DB jsonb) into safe {width,url} entries. */
export function parseVariantPaths(
  value: unknown,
  toUrl: (path: string) => string,
): PostVariant[] {
  if (!Array.isArray(value)) return [];
  const variants: PostVariant[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const v = item as Record<string, unknown>;
    if (typeof v.path !== "string" || typeof v.width !== "number") continue;
    variants.push({ width: v.width, url: toUrl(v.path) });
  }
  return variants.sort((a, b) => a.width - b.width);
}

export function isPostCategory(value: unknown): value is PostCategory {
  return POST_CATEGORIES.includes(value as PostCategory);
}

/** Fixed-locale date — identical on server and client (no hydration drift). */
export function formatPostDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}
