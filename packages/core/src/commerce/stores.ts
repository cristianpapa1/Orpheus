import type { School } from "../design/schools";

/** A maker's Astelier storefront. Pure domain type — shared by web + tests. */
export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  /** Public URL of the banner image, or null. */
  banner_url: string | null;
  accent: StoreAccent;
  school: School;
  is_active: boolean;
}

export type StoreAccent = "red" | "blue" | "yellow";

export function toStoreAccent(v: unknown): StoreAccent {
  return v === "blue" || v === "yellow" ? v : "red";
}

/** Turn a store name into a URL-safe slug candidate. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining accents (é -> e)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// 3–40 chars, lowercase alphanumeric + internal hyphens (no leading/trailing -).
export const STORE_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export function isValidStoreSlug(slug: string): boolean {
  return STORE_SLUG_RE.test(slug);
}

export const MAX_STORE_NAME = 60;
export const MAX_STORE_DESCRIPTION = 600;
