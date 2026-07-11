"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { toSchool } from "@atelier/core/design/schools";
import { parseLayout, serializeLayout } from "@atelier/core/profile/layout";
import { HANDLE_RE, parseContacts } from "@atelier/core/profile/types";

export interface SaveProfileInput {
  display_name: string;
  handle: string;
  bio: string;
  contacts: unknown;
  layout: string; // serialized ProfileLayout
  accent?: string;
  school?: string;
  /** Edit a profile you MANAGE instead of your own (institution claim). */
  targetId?: string;
}

export interface SaveProfileResult {
  ok: boolean;
  error?: string;
}

/**
 * Appearance-only settings (school + accent) — a plain form action from
 * /profile/settings. Touches nothing else on the profile.
 */
export async function saveAppearance(formData: FormData) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/profile/settings?error=unavailable");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const school = toSchool(formData.get("school"));
  const accentRaw = String(formData.get("accent") ?? "");
  const accent = ["red", "blue", "yellow"].includes(accentRaw)
    ? accentRaw
    : "red";

  const { error } = await supabase
    .from("profiles")
    .update({ school, accent, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) redirect("/profile/settings?error=save");

  const { data } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();
  if (data?.handle) revalidatePath(`/u/${data.handle}`);
  revalidatePath("/profile");
  redirect("/profile/settings?saved=1");
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

  // Owner edits their own profile; a manager may edit a profile they manage.
  const targetId = input.targetId && input.targetId !== user.id ? input.targetId : user.id;
  if (targetId !== user.id) {
    const { data: tgt } = await supabase
      .from("profiles")
      .select("managed_by")
      .eq("id", targetId)
      .maybeSingle();
    if (!tgt || tgt.managed_by !== user.id) {
      return { ok: false, error: "You don't manage that profile." };
    }
  }

  const handle = input.handle.trim().toLowerCase();
  if (!HANDLE_RE.test(handle)) {
    return {
      ok: false,
      error: "Handle must be 3–30 chars: lowercase letters, numbers, _",
    };
  }

  const display_name = input.display_name.trim().slice(0, 80);
  const bio = input.bio.trim().slice(0, 600);
  const contacts = parseContacts(input.contacts);
  const layout = parseLayout(input.layout);
  const accent = ["red", "blue", "yellow"].includes(input.accent ?? "")
    ? input.accent
    : "red";
  const school = toSchool(input.school);

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name,
      handle,
      bio,
      links: contacts,
      layout: JSON.parse(serializeLayout(layout)),
      accent,
      school,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetId);

  if (error) {
    const msg = error.code === "23505" ? "That handle is taken." : error.message;
    return { ok: false, error: msg };
  }

  revalidatePath(`/u/${handle}`);
  revalidatePath("/profile");
  return { ok: true };
}
