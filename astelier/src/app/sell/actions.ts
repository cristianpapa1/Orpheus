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
import { isViewerCreator } from "@/lib/validation";

export interface SaveStoreInput {
  name: string;
  slug: string;
  description: string;
  accent?: string;
  school?: string;
  /** Storage path of the banner image. `null` clears it; omit to leave it unchanged. */
  banner_path?: string | null;
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

  // A store requires an approved creator. Curator status no longer blocks it:
  // a curator who is ALSO a creator can sell; a curator who isn't a creator is
  // blocked here (not a creator), same as any member.
  if (!(await isViewerCreator())) {
    return {
      ok: false,
      error:
        "Only approved makers can open an Astelier shop. Become a creator on Atelier first.",
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

  // Only touch banner_path when the editor sent one — `undefined` leaves the
  // stored banner alone, `null` clears it, a string sets it.
  const bannerPatch =
    input.banner_path === undefined
      ? {}
      : { banner_path: input.banner_path ? input.banner_path.slice(0, 400) : null };

  const { error } = await supabase.from("astelier_stores").upsert(
    {
      owner_id: user.id,
      name,
      slug,
      description,
      accent,
      school,
      ...bannerPatch,
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
