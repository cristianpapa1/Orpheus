"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyStore } from "@/lib/stores/queries";
import {
  cleanExternalUrl,
  MAX_PRODUCT_TITLE,
  MAX_PRODUCT_DESCRIPTION,
} from "@atelier/core/commerce/products";
import { MAX_PRICE_CENTS } from "@atelier/core/commerce/money";

export interface ImportCandidate {
  title: string;
  price: number; // major units, e.g. 24.99
  description: string;
  image_url: string | null;
  product_url: string | null;
}

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          price: { type: "number", description: "price as a number in the store's currency" },
          description: { type: "string" },
          image_url: { type: "string", description: "absolute URL of the main product image" },
          product_url: { type: "string", description: "absolute URL of the product's own page" },
        },
      },
    },
  },
} as const;

function resolveUrl(raw: unknown, base: string): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return new URL(raw, base).href;
  } catch {
    return null;
  }
}

function normalize(raw: unknown, base: string): ImportCandidate | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = typeof r.title === "string" ? r.title.trim().slice(0, MAX_PRODUCT_TITLE) : "";
  if (!title) return null;
  const price = typeof r.price === "number" && Number.isFinite(r.price) && r.price >= 0 ? r.price : 0;
  const description =
    typeof r.description === "string" ? r.description.trim().slice(0, MAX_PRODUCT_DESCRIPTION) : "";
  return {
    title,
    price,
    description,
    image_url: resolveUrl(r.image_url, base),
    product_url: resolveUrl(r.product_url, base),
  };
}

/** Scrape a seller's existing shop URL into candidate products for review.
 *  No DB writes — the seller confirms before anything is imported. */
export async function scrapeCatalog(
  url: string,
): Promise<{ ok: boolean; candidates?: ImportCandidate[]; error?: string }> {
  const store = await getMyStore();
  if (!store) return { ok: false, error: "Open a store first." };

  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return { ok: false, error: "Import isn't configured (no Firecrawl key)." };

  let target: string;
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("proto");
    target = u.href;
  } catch {
    return { ok: false, error: "Enter a valid http(s) URL." };
  }

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        url: target,
        formats: ["extract"],
        extract: {
          schema: EXTRACT_SCHEMA,
          prompt:
            "Extract every product for sale on this page: title, numeric price, a short description, the main image URL, and the product's own page URL.",
        },
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `Couldn't read that page (HTTP ${res.status}).` };
    }
    const json = (await res.json()) as {
      data?: { extract?: { products?: unknown }; json?: { products?: unknown } };
    };
    const rawList = json.data?.extract?.products ?? json.data?.json?.products ?? [];
    const candidates = (Array.isArray(rawList) ? rawList : [])
      .slice(0, 40)
      .map((r) => normalize(r, target))
      .filter((c): c is ImportCandidate => c !== null);
    return { ok: true, candidates };
  } catch {
    return { ok: false, error: "Import failed — try again, or add products manually." };
  }
}

export interface ImportResult {
  ok: boolean;
  imported?: number;
  error?: string;
}

/** Import the seller-approved candidates as DRAFT products. Downloads each image
 *  into the media bucket; the product's own page becomes its external buy link. */
export async function importCatalog(candidates: ImportCandidate[]): Promise<ImportResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Astelier is not configured." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to import." };
  const store = await getMyStore();
  if (!store) return { ok: false, error: "Open a store first." };

  const list = (candidates ?? []).slice(0, 40).filter((c) => c && c.title?.trim());
  if (!list.length) return { ok: false, error: "Nothing selected to import." };

  const IMG_EXT: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
  };

  const rows: Record<string, unknown>[] = [];
  for (const c of list) {
    const images: string[] = [];
    if (c.image_url) {
      try {
        const r = await fetch(c.image_url, { redirect: "follow" });
        const type = (r.headers.get("content-type") ?? "").split(";")[0].trim();
        if (r.ok && type.startsWith("image/")) {
          const bytes = new Uint8Array(await r.arrayBuffer());
          if (bytes.byteLength > 0 && bytes.byteLength <= 10_000_000) {
            const ext = IMG_EXT[type] ?? "jpg";
            const path = `${user.id}/products/${crypto.randomUUID()}.${ext}`;
            const { error: upErr } = await supabase.storage
              .from("media")
              .upload(path, bytes, { contentType: type, upsert: true });
            if (!upErr) images.push(path);
          }
        }
      } catch {
        /* image best-effort — skip on failure */
      }
    }
    const cents = Math.min(MAX_PRICE_CENTS, Math.max(0, Math.round((c.price || 0) * 100)));
    rows.push({
      store_id: store.id,
      title: c.title.trim().slice(0, MAX_PRODUCT_TITLE),
      description: (c.description ?? "").trim().slice(0, MAX_PRODUCT_DESCRIPTION),
      price_cents: cents,
      images,
      external_url: cleanExternalUrl(c.product_url),
      status: "draft",
      updated_at: new Date().toISOString(),
    });
  }

  const { error } = await supabase.from("astelier_products").insert(rows);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/sell");
  return { ok: true, imported: rows.length };
}
