import { createServerSupabase } from "@/lib/supabase/server";

/**
 * The Astelier access gate: you participate in the community before you
 * transact. A signed-in user unlocks Astelier once they follow ≥ 15 makers
 * on Atelier — read straight off the shared `follows` table (same Supabase
 * project as Atelier). No new auth, no new membership concept.
 */
export const REQUIRED_FOLLOWS = 15;

export interface GateState {
  configured: boolean;
  signedIn: boolean;
  followCount: number;
  remaining: number;
  unlocked: boolean;
  handle: string | null;
  displayName: string | null;
}

const LOCKED: GateState = {
  configured: false,
  signedIn: false,
  followCount: 0,
  remaining: REQUIRED_FOLLOWS,
  unlocked: false,
  handle: null,
  displayName: null,
};

export async function getGateState(): Promise<GateState> {
  const supabase = await createServerSupabase();
  if (!supabase) return LOCKED;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...LOCKED, configured: true };

  const [{ count }, { data: profile }] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", user.id),
    supabase
      .from("profiles")
      .select("handle, display_name")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const followCount = count ?? 0;
  return {
    configured: true,
    signedIn: true,
    followCount,
    remaining: Math.max(0, REQUIRED_FOLLOWS - followCount),
    unlocked: followCount >= REQUIRED_FOLLOWS,
    handle: profile?.handle ?? null,
    displayName: profile?.display_name ?? null,
  };
}
