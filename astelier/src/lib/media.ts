import { SUPABASE_URL } from "@/lib/supabase/config";

// When set, media is served through the Cloudflare-fronted CDN domain
// (e.g. https://cdn.aunflaneur.com) instead of directly from Supabase — edge
// caching + hotlink control, with Supabase as the cache-miss origin. Unset →
// direct Supabase public URLs. Same switch as Atelier; both apps share the bucket.
const MEDIA_CDN = (process.env.NEXT_PUBLIC_MEDIA_CDN_URL ?? "").replace(/\/+$/, "");

/** Public URL for an object in the shared `media` bucket (same bucket Atelier
 *  uses — one Supabase project). */
export function publicMediaUrl(path: string): string {
  if (MEDIA_CDN) return `${MEDIA_CDN}/${path}`;
  return `${SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}
