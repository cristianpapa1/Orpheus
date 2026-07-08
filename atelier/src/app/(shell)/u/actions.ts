"use server";

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
