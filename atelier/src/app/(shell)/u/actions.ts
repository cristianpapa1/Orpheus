"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export interface FollowResult {
  ok: boolean;
  error?: string;
}

/** Follow a creator. Self-follow is guarded here AND by a DB check constraint. */
export async function follow(
  targetId: string,
  handle: string,
): Promise<FollowResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Preview mode — sign-in disabled." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to follow creators." };
  if (user.id === targetId)
    return { ok: false, error: "You can't follow yourself." };

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, followee_id: targetId });

  if (error && error.code !== "23505") return { ok: false, error: error.message };
  revalidatePath(`/u/${handle}`);
  return { ok: true };
}

export async function unfollow(
  targetId: string,
  handle: string,
): Promise<FollowResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Preview mode — sign-in disabled." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("followee_id", targetId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/u/${handle}`);
  return { ok: true };
}

/**
 * Request to claim a seeded institution profile. Records a pending claim an
 * admin later approves; RLS enforces that only seed, unclaimed profiles can be
 * claimed and only as the signed-in user.
 */
export async function requestClaim(formData: FormData) {
  const handle = String(formData.get("handle") ?? "");
  const supabase = await createServerSupabase();
  if (!supabase) redirect(`/u/${handle}?claim=unavailable`);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profileId = String(formData.get("profile_id") ?? "");
  const message = String(formData.get("message") ?? "").trim().slice(0, 1000);

  const { error } = await supabase.from("profile_claims").upsert(
    { profile_id: profileId, claimant_id: user.id, message, status: "pending" },
    { onConflict: "profile_id,claimant_id" },
  );
  if (error) redirect(`/u/${handle}?claim=error`);

  revalidatePath(`/u/${handle}`);
  redirect(`/u/${handle}?claim=sent`);
}
