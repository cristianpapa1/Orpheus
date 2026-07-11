"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  HANDLE_RE,
  accountType,
  isInstitutionKind,
  parseInterests,
} from "@atelier/core/profile/types";

export interface OnboardingInput {
  display_name: string;
  handle: string;
  account_type: string;
  institution_kind: string | null;
  interests: string[];
}

export interface OnboardingResult {
  ok: boolean;
  error?: string;
}

/**
 * First-login setup: force a public display name + handle (never the email),
 * an account type, and interests. Stamps `onboarded_at`, which lifts the
 * onboarding gate in the auth callback.
 */
export async function completeOnboarding(
  input: OnboardingInput,
): Promise<OnboardingResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const display_name = input.display_name.trim().slice(0, 80);
  if (display_name.length < 2) {
    return { ok: false, error: "Choose a public display name (2+ characters)." };
  }
  if (user.email && display_name.toLowerCase() === user.email.toLowerCase()) {
    return { ok: false, error: "Your public name can't be your email address." };
  }

  const handle = input.handle.trim().toLowerCase();
  if (!HANDLE_RE.test(handle)) {
    return {
      ok: false,
      error: "Handle must be 3–30 chars: lowercase letters, numbers, _",
    };
  }

  const account_type = accountType(input.account_type);
  const institution_kind =
    account_type === "institution" && isInstitutionKind(input.institution_kind)
      ? input.institution_kind
      : null;
  if (account_type === "institution" && !institution_kind) {
    return { ok: false, error: "Pick what kind of institution this is." };
  }

  const interests = parseInterests(input.interests);

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name,
      handle,
      account_type,
      institution_kind,
      interests,
      onboarded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "That handle is taken." : error.message,
    };
  }

  revalidatePath("/feed");
  revalidatePath(`/u/${handle}`);
  return { ok: true };
}
