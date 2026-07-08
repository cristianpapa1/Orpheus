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
  created_at: string; // ISO-8601
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
