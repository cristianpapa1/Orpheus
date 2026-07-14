"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  slugify,
  isValidStoreSlug,
  toStoreAccent,
  MAX_STORE_NAME,
  MAX_STORE_DESCRIPTION,
} from "@atelier/core/commerce/stores";
import { toSchool } from "@atelier/core/design/schools";
import { REQUIRED_FOLLOWS } from "@/lib/gate";

export interface SaveStoreInput {
  name: string;
  slug: string;
  description: string;
  accent?: string;
  school?: string;
}

export interface SaveStoreResult {
  ok: boolean;
  error?: string;
  slug?: string;
}

/** Create or update the signed-in user's store (one per profile). Re-checks the
 *  15-follow gate server-side — never trust the client. */
export async function saveStore(input: SaveStoreInput): Promise<SaveStoreResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Astelier is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to open a store." };

  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", user.id);
  if ((count ?? 0) < REQUIRED_FOLLOWS) {
    return {
      ok: false,
      error: `Follow ${REQUIRED_FOLLOWS} makers on Atelier before opening a store.`,
    };
  }

  const name = input.name.trim().slice(0, MAX_STORE_NAME);
  if (!name) return { ok: false, error: "Your store needs a name." };

  const slug = input.slug.trim() ? slugify(input.slug) : slugify(name);
  if (!isValidStoreSlug(slug)) {
    return {
      ok: false,
      error: "Store handle must be 3–40 chars: lowercase letters, numbers, hyphens.",
    };
  }

  const description = input.description.trim().slice(0, MAX_STORE_DESCRIPTION);
  const accent = toStoreAccent(input.accent);
  const school = toSchool(input.school);

  const { error } = await supabase.from("astelier_stores").upsert(
    {
      owner_id: user.id,
      name,
      slug,
      description,
      accent,
      school,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id" },
  );

  if (error) {
    const msg = error.code === "23505" ? "That store handle is taken." : error.message;
    return { ok: false, error: msg };
  }

  revalidatePath("/sell");
  revalidatePath(`/store/${slug}`);
  return { ok: true, slug };
}
