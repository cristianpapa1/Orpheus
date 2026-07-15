import { createServerSupabase } from "@/lib/supabase/server";
import { publicMediaUrl } from "@/lib/media";
import { toProductStatus, type Product } from "@atelier/core/commerce/products";

/* Product reads. Defensive: table-missing → empty/null, never throws. */

const PRODUCT_COLUMNS =
  "id, store_id, title, description, price_cents, currency, images, disciplines, external_url, status";

type ProductRow = {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  price_cents: number | null;
  currency: string | null;
  images: unknown;
  disciplines: string[] | null;
  external_url: string | null;
  status: string | null;
};

function toImageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((p): p is string => typeof p === "string" && p.length > 0)
    .map(publicMediaUrl);
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    store_id: row.store_id,
    title: row.title,
    description: row.description ?? "",
    price_cents: row.price_cents ?? 0,
    currency: row.currency ?? "usd",
    image_urls: toImageUrls(row.images),
    disciplines: row.disciplines ?? [],
    external_url: row.external_url,
    status: toProductStatus(row.status),
  };
}

/** Public catalog for a store — live products, newest first. */
export async function getLiveProductsByStore(storeId: string): Promise<Product[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("astelier_products")
    .select(PRODUCT_COLUMNS)
    .eq("store_id", storeId)
    .eq("status", "live")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => toProduct(r as ProductRow));
}

/** All of a store's products (any status) — owner view for /sell. */
export async function getProductsForStore(storeId: string): Promise<Product[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("astelier_products")
    .select(PRODUCT_COLUMNS)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => toProduct(r as ProductRow));
}

/** A single product. RLS returns it only if live or viewer owns the store. */
export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("astelier_products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return toProduct(data as ProductRow);
}
