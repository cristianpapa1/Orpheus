import { createServerSupabase } from "@/lib/supabase/server";

/* Seller analytics reads. Defensive: if the analytics columns don't exist yet
   (migration not applied), everything reads as 0. */

export async function getProductViewCounts(storeId: string): Promise<Map<string, number>> {
  const m = new Map<string, number>();
  const supabase = await createServerSupabase();
  if (!supabase) return m;
  const { data, error } = await supabase
    .from("astelier_products")
    .select("id, view_count")
    .eq("store_id", storeId);
  if (error || !data) return m;
  for (const r of data as { id: string; view_count?: number }[]) {
    m.set(r.id, r.view_count ?? 0);
  }
  return m;
}

export async function getStoreViews(storeId: string): Promise<number> {
  const supabase = await createServerSupabase();
  if (!supabase) return 0;
  const { data, error } = await supabase
    .from("astelier_stores")
    .select("view_count")
    .eq("id", storeId)
    .maybeSingle();
  if (error || !data) return 0;
  return (data as { view_count?: number }).view_count ?? 0;
}

/** How many Atelier makers follow this seller — their reach signal. */
export async function getFollowerReach(ownerId: string): Promise<number> {
  const supabase = await createServerSupabase();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("followee_id", ownerId);
  return count ?? 0;
}
