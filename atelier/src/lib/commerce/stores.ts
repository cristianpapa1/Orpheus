import { createServerSupabase } from "@/lib/supabase/server";

const ASTELIER_URL =
  process.env.NEXT_PUBLIC_ASTELIER_URL ?? "https://astelier.aunflaneur.com";

export interface StoreLink {
  slug: string;
  name: string;
  url: string;
}

/**
 * The Astelier store for a profile, if they have an active one. This is the
 * only bridge from Atelier into Astelier — a user-owned link, never promoted
 * or ranked. Defensive: if the astelier_stores table doesn't exist yet, or the
 * owner has no store, returns null (the link simply doesn't render).
 */
export async function getStoreLinkForOwner(
  ownerId: string,
): Promise<StoreLink | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("astelier_stores")
    .select("slug, name")
    .eq("owner_id", ownerId)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;

  return { slug: data.slug, name: data.name, url: `${ASTELIER_URL}/store/${data.slug}` };
}
