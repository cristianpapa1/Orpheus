import { SUPABASE_URL } from "@/lib/supabase/config";

/** Public URL for an object in the shared `media` bucket (same bucket Atelier
 *  uses — one Supabase project). */
export function publicMediaUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}
