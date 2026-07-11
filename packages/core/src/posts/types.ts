import { DEFAULT_DISPLAY, type PostDisplay } from "./display";

export const POST_CATEGORIES = [
  "music",
  "writing",
  "theater",
  "film",
  "dance",
  "visual",
  "photography",
  "handmade",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<PostCategory, string> = {
  music: "Music",
  writing: "Writing & Poetry",
  theater: "Theater",
  film: "Film",
  dance: "Dance",
  visual: "Visual Art",
  photography: "Photography",
  handmade: "Handmade",
};

/**
 * Optional second level under a category — the *style* the user asked for
 * (e.g. music → jazz). Categories not listed here have no subcategories.
 * Kept as the single source of truth: the DB stores free text, the app
 * constrains it to this map.
 */
export const SUBCATEGORIES = {
  music: [
    "classical",
    "jazz",
    "electronic",
    "hip-hop",
    "rock",
    "folk",
    "ambient",
    "experimental",
    "world",
    "pop",
  ],
  writing: [
    "poetry",
    "fiction",
    "essay",
    "playwriting",
    "journalism",
    "criticism",
  ],
  theater: ["drama", "comedy", "physical", "musical-theater", "performance"],
  film: ["short", "documentary", "animation", "experimental", "music-video"],
  visual: [
    "painting",
    "drawing",
    "sculpture",
    "printmaking",
    "illustration",
    "digital",
    "mixed-media",
  ],
} as const satisfies Partial<Record<PostCategory, readonly string[]>>;

/** Human label for a subcategory slug (Title-Cased, hyphens → spaces). */
export function subcategoryLabel(sub: string): string {
  return sub
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** The subcategory options for a category, or [] if it has none. */
export function subcategoriesFor(category: string): readonly string[] {
  return (SUBCATEGORIES as Record<string, readonly string[]>)[category] ?? [];
}

/** Validate a (category, subcategory) pair — subcategory must belong or be null. */
export function isValidSubcategory(
  category: string,
  subcategory: unknown,
): subcategory is string | null {
  if (subcategory === null || subcategory === undefined || subcategory === "") {
    return true;
  }
  if (typeof subcategory !== "string") return false;
  return subcategoriesFor(category).includes(subcategory);
}

export interface PostVariant {
  width: number;
  url: string;
}

/* ── Track B: posts beyond images ───────────────────────────── */

export const MEDIA_TYPES = ["image", "video", "audio", "text"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

/** Longest a text post (poem / paragraph) may be. */
export const MAX_BODY_CHARS = 4000;

/** Per-type caps — shorts, not features. Server AND client enforced. */
export const MEDIA_LIMITS = {
  video: { maxSeconds: 120, maxBytes: 150 * 1024 * 1024 },
  audio: { maxSeconds: 300, maxBytes: 30 * 1024 * 1024 },
} as const;

export const MEDIA_EXT: Record<Exclude<MediaType, "image" | "text">, Record<string, string>> = {
  video: { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" },
  audio: {
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
  },
};

export function isMediaType(value: unknown): value is MediaType {
  return MEDIA_TYPES.includes(value as MediaType);
}

/** Validate a duration against the per-type cap. Image/text → must be null. */
export function validDuration(
  mediaType: MediaType,
  seconds: number | null,
): boolean {
  if (mediaType === "image" || mediaType === "text") return seconds === null;
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return false;
  return seconds <= MEDIA_LIMITS[mediaType].maxSeconds;
}

/** mm:ss for players — fixed format, hydration-safe. */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export interface Post {
  id: string;
  author_id: string;
  author_handle: string;
  author_name: string;
  caption: string;
  category: PostCategory;
  /** Optional style within the category (music → jazz). Null when not set. */
  subcategory: string | null;
  /** Text posts (media_type 'text') carry their work here — a poem/paragraph. */
  body: string | null;
  /** Empty string for text posts (no image). */
  image_url: string;
  image_width: number | null;
  image_height: number | null;
  /** Untouched full-resolution original, when the author uploaded one. */
  original_url: string | null;
  /** Optimized display sizes, ascending by width. */
  variants: PostVariant[];
  /** Tiny inline blur-up placeholder (data URI). */
  blur_data: string | null;
  /** Author-written alt text (a11y); falls back to caption when null. */
  alt_text: string | null;
  /** Track B: image | video | audio. AV originals live untouched in storage. */
  media_type: MediaType;
  /** URL of the video/audio file (null for images). */
  media_url: string | null;
  duration_seconds: number | null;
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
