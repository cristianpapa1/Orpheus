"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { parseLayout, serializeLayout } from "@/lib/profile/layout";
import { HANDLE_RE, parseLinks } from "@/lib/profile/types";

export interface SaveProfileInput {
  display_name: string;
  handle: string;
  bio: string;
  links: unknown;
  layout: string; // serialized ProfileLayout
}

export interface SaveProfileResult {
  ok: boolean;
  error?: string;
}

/**
 * Persist the profile a user built. Everything is re-validated server-side:
 * the layout goes through parseLayout so invalid JSON can never overwrite a
 * stored layout (ISA anti-criterion ISC-74).
 */
export async function saveProfile(
  input: SaveProfileInput,
): Promise<SaveProfileResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const handle = input.handle.trim().toLowerCase();
  if (!HANDLE_RE.test(handle)) {
    return {
      ok: false,
      error: "Handle must be 3–30 chars: lowercase letters, numbers, _",
    };
  }

  const display_name = input.display_name.trim().slice(0, 80);
  const bio = input.bio.trim().slice(0, 600);
  const links = parseLinks(input.links);
  const layout = parseLayout(input.layout);

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name,
      handle,
      bio,
      links,
      layout: JSON.parse(serializeLayout(layout)),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    const msg = error.code === "23505" ? "That handle is taken." : error.message;
    return { ok: false, error: msg };
  }

  revalidatePath(`/u/${handle}`);
  revalidatePath("/profile");
  return { ok: true };
}
