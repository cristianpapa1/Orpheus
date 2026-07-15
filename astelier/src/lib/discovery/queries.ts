import { createServerSupabase } from "@/lib/supabase/server";
import { publicMediaUrl } from "@/lib/media";
import { toProductStatus, type Product } from "@atelier/core/commerce/products";

/* Discovery: browse + search across every live store/product. No ranking —
   chronological or price sort only (Atelier's principle). Defensive throughout. */

export interface BrowseProduct extends Product {
  store_slug: string;
  store_name: string;
  store_school: string;
}

export type BrowseSort = "new" | "price-asc" | "price-desc";

export interface BrowseOptions {
  discipline?: string | null; // a cat:* value
  school?: string | null;
  sort?: BrowseSort;
}

const BROWSE_SELECT =
  "id, store_id, title, description, price_cents, currency, images, disciplines, external_url, status, created_at, store:astelier_stores!inner(slug, name, school, is_active)";

function mapBrowseProduct(r: Record<string, unknown>): BrowseProduct {
  const storeRaw = (r.store as unknown) ?? {};
  const store = (Array.isArray(storeRaw) ? storeRaw[0] : storeRaw) as Record<string, unknown>;
  const images = Array.isArray(r.images) ? r.images : [];
  return {
    id: String(r.id),
    store_id: String(r.store_id),
    title: String(r.title ?? ""),
    description: String(r.description ?? ""),
    price_cents: typeof r.price_cents === "number" ? r.price_cents : 0,
    currency: String(r.currency ?? "usd"),
    image_urls: images
      .filter((p: unknown): p is string => typeof p === "string" && p.length > 0)
      .map(publicMediaUrl),
    disciplines: Array.isArray(r.disciplines) ? (r.disciplines as string[]) : [],
    external_url: (r.external_url as string) ?? null,
    status: toProductStatus(r.status),
    store_slug: String(store.slug ?? ""),
    store_name: String(store.name ?? ""),
    store_school: String(store.school ?? "bauhaus"),
  };
}

export async function browseProducts(opts: BrowseOptions = {}): Promise<BrowseProduct[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  let q = supabase
    .from("astelier_products")
    .select(BROWSE_SELECT)
    .eq("status", "live")
    .eq("store.is_active", true);

  if (opts.discipline) q = q.contains("disciplines", [opts.discipline]);
  if (opts.school) q = q.eq("store.school", opts.school);

  if (opts.sort === "price-asc") q = q.order("price_cents", { ascending: true });
  else if (opts.sort === "price-desc") q = q.order("price_cents", { ascending: false });
  else q = q.order("created_at", { ascending: false });

  const { data, error } = await q.limit(60);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapBrowseProduct);
}

export interface SearchResults {
  stores: { slug: string; name: string; description: string }[];
  products: BrowseProduct[];
}

export async function searchAstelier(query: string): Promise<SearchResults> {
  const supabase = await createServerSupabase();
  const safe = query.replace(/[,%_()*]/g, " ").trim();
  if (!supabase || !safe) return { stores: [], products: [] };
  const pat = `%${safe}%`;

  const [storesRes, productsRes] = await Promise.all([
    supabase
      .from("astelier_stores")
      .select("slug, name, description")
      .eq("is_active", true)
      .or(`name.ilike.${pat},description.ilike.${pat}`)
      .limit(20),
    supabase
      .from("astelier_products")
      .select(BROWSE_SELECT)
      .eq("status", "live")
      .eq("store.is_active", true)
      .or(`title.ilike.${pat},description.ilike.${pat}`)
      .limit(20),
  ]);

  return {
    stores: (storesRes.data ?? []).map((s) => ({
      slug: String(s.slug),
      name: String(s.name),
      description: String(s.description ?? ""),
    })),
    products: ((productsRes.data as Record<string, unknown>[]) ?? []).map(mapBrowseProduct),
  };
}
