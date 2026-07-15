"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { parsePriceToCents } from "@atelier/core/commerce/money";
import {
  toProductStatus,
  cleanExternalUrl,
  MAX_PRODUCT_TITLE,
  MAX_PRODUCT_DESCRIPTION,
  MAX_PRODUCT_IMAGES,
} from "@atelier/core/commerce/products";
import { parseDisciplines } from "@atelier/core/taxonomy/disciplines";
import { getMyStore } from "@/lib/stores/queries";

export interface SaveProductInput {
  id?: string;
  title: string;
  description: string;
  price: string;
  images: string[];
  disciplines: string[];
  external_url: string;
  status: string;
}

export interface SaveProductResult {
  ok: boolean;
  error?: string;
  id?: string;
}

/** Create or update a product on the signed-in user's store. Ownership is
 *  enforced by RLS (product → store.owner_id) and re-scoped here to store.id. */
export async function saveProduct(input: SaveProductInput): Promise<SaveProductResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Astelier is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to manage products." };

  const store = await getMyStore();
  if (!store) return { ok: false, error: "Open a store before adding products." };

  const title = input.title.trim().slice(0, MAX_PRODUCT_TITLE);
  if (!title) return { ok: false, error: "A product needs a title." };

  const price_cents = parsePriceToCents(input.price);
  if (price_cents === null) return { ok: false, error: "Enter a valid price (e.g. 24 or 24.99)." };

  const description = input.description.trim().slice(0, MAX_PRODUCT_DESCRIPTION);
  const images = (input.images ?? [])
    .filter((p) => typeof p === "string" && p.length > 0)
    .slice(0, MAX_PRODUCT_IMAGES);
  const disciplines = parseDisciplines(input.disciplines);
  const external_url = cleanExternalUrl(input.external_url);
  const status = toProductStatus(input.status);

  const row = {
    store_id: store.id,
    title,
    description,
    price_cents,
    images,
    disciplines,
    external_url,
    status,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase
      .from("astelier_products")
      .update(row)
      .eq("id", input.id)
      .eq("store_id", store.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/product/${input.id}`);
    revalidatePath("/sell");
    revalidatePath(`/store/${store.slug}`);
    return { ok: true, id: input.id };
  }

  const { data, error } = await supabase
    .from("astelier_products")
    .insert(row)
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Couldn't save the product." };
  revalidatePath("/sell");
  revalidatePath(`/store/${store.slug}`);
  return { ok: true, id: data.id };
}

export async function deleteProduct(id: string): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const store = await getMyStore();
  if (!store) return { ok: false };
  await supabase.from("astelier_products").delete().eq("id", id).eq("store_id", store.id);
  revalidatePath("/sell");
  return { ok: true };
}

/** Form-action wrapper for the delete button on /sell. */
export async function deleteProductForm(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) await deleteProduct(id);
}
