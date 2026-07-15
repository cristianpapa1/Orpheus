/** A product in a maker's Astelier store. Pure domain type. */
export interface Product {
  id: string;
  store_id: string;
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  /** Public image URLs (first is the cover). */
  image_urls: string[];
  /** Reuses Atelier's discipline taxonomy (cat:* / sub:*). */
  disciplines: string[];
  /** Seller's own shop link — Fulfilment I (link-out). Null → no buy link yet. */
  external_url: string | null;
  status: ProductStatus;
}

export type ProductStatus = "draft" | "live" | "sold_out";

export const PRODUCT_STATUSES: readonly ProductStatus[] = [
  "draft",
  "live",
  "sold_out",
] as const;

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  draft: "Draft",
  live: "Live",
  sold_out: "Sold out",
};

export function toProductStatus(v: unknown): ProductStatus {
  return v === "live" || v === "sold_out" ? v : "draft";
}

export const MAX_PRODUCT_TITLE = 120;
export const MAX_PRODUCT_DESCRIPTION = 2000;
export const MAX_PRODUCT_IMAGES = 6;

/** An external buy link must be a plain http(s) URL — never javascript:, data:,
 *  etc. Returns the trimmed URL or null. */
export function cleanExternalUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}
