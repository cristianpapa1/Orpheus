"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { toSchool } from "@atelier/core/design/schools";
import { parseLayout, serializeLayout } from "@atelier/core/profile/layout";
import { HANDLE_RE, parseContacts } from "@atelier/core/profile/types";

/** Photos live in our own public media bucket. Only accept a cleared value
 *  (null) or a URL under that bucket — never an arbitrary external URL, which
 *  could be a tracking pixel or point anywhere. Anything else leaves the
 *  stored photo untouched. */
const AVATAR_URL_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/media/`;
function cleanAvatarUrl(v: unknown): string | null | undefined {
  if (v === null || v === "") return null;
  if (typeof v === "string" && v.startsWith(AVATAR_URL_PREFIX)) return v;
  return undefined;
}

export interface SaveProfileInput {
  display_name: string;
  handle: string;
  bio: string;
  contacts: unknown;
  layout: string; // serialized ProfileLayout
  accent?: string;
  school?: string;
  /** Public profile photo URL (from our media bucket), or null to clear. */
  avatar_url?: string | null;
  /** Edit a profile you MANAGE instead of your own (institution claim). */
  targetId?: string;
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

  const update: Record<string, unknown> = {
    display_name,
    handle,
    bio,
    links: contacts,
    layout: JSON.parse(serializeLayout(layout)),
    accent,
    school,
    updated_at: new Date().toISOString(),
  };
  const avatar = cleanAvatarUrl(input.avatar_url);
  if (avatar !== undefined) update.avatar_url = avatar;

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", targetId);

  if (error) {
    const msg = error.code === "23505" ? "That handle is taken." : error.message;
    return { ok: false, error: msg };
  }

  revalidatePath(`/u/${handle}`);
  revalidatePath("/profile");
  return { ok: true };
}
