import { createServerSupabase } from "@/lib/supabase/server";

/** A curator needs both: mutually-following institutions, and quality follows. */
export const CURATOR_INSTITUTIONS_REQUIRED = 3;
export const CURATOR_QUALITY_FOLLOWS_REQUIRED = 30;

export interface CuratorProgress {
  isCurator: boolean;
  mutualInstitutions: number;
  qualityFollows: number;
  needInstitutions: number;
  needQuality: number;
}

const EMPTY: CuratorProgress = {
  isCurator: false,
  mutualInstitutions: 0,
  qualityFollows: 0,
  needInstitutions: CURATOR_INSTITUTIONS_REQUIRED,
  needQuality: CURATOR_QUALITY_FOLLOWS_REQUIRED,
};

/**
 * Whether a profile currently qualifies as a curator — the single source of
 * truth is the `is_curator` SQL function (same test RLS enforces on reposts).
 * Defensive: any error (feature not migrated) → false, so the capability stays
 * off rather than the page breaking.
 */
export async function isCurator(profileId: string): Promise<boolean> {
  const supabase = await createServerSupabase();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("is_curator", { uid: profileId });
  if (error) return false;
  return Boolean(data);
}

/** Whether the signed-in viewer is a curator. */
export async function isViewerCurator(): Promise<boolean> {
  const supabase = await createServerSupabase();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  return isCurator(user.id);
}

/**
 * Detailed progress toward curator status for the profile dashboard. Computed in
 * TS from the public follow graph, mirroring is_curator() exactly. Defensive → EMPTY.
 */
export async function getCuratorProgress(profileId: string): Promise<CuratorProgress> {
  const supabase = await createServerSupabase();
  if (!supabase) return EMPTY;

  const { data: followRows, error } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", profileId);
  if (error) return EMPTY;
  const followeeIds = (followRows ?? []).map((r) => r.followee_id);
  if (followeeIds.length === 0) return EMPTY;

  const { data: profs } = await supabase
    .from("profiles")
    .select("id, account_type, quality_stamp")
    .in("id", followeeIds);
  const rows = profs ?? [];

  const qualityFollows = rows.filter((p) => p.quality_stamp).length;
  const institutionIds = rows
    .filter((p) => p.account_type === "institution")
    .map((p) => p.id);

  let mutualInstitutions = 0;
  if (institutionIds.length) {
    // Of the institutions this profile follows, how many follow back?
    const { data: back } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("followee_id", profileId)
      .in("follower_id", institutionIds);
    mutualInstitutions = new Set((back ?? []).map((r) => r.follower_id)).size;
  }

  return {
    isCurator:
      mutualInstitutions >= CURATOR_INSTITUTIONS_REQUIRED &&
      qualityFollows >= CURATOR_QUALITY_FOLLOWS_REQUIRED,
    mutualInstitutions,
    qualityFollows,
    needInstitutions: Math.max(0, CURATOR_INSTITUTIONS_REQUIRED - mutualInstitutions),
    needQuality: Math.max(0, CURATOR_QUALITY_FOLLOWS_REQUIRED - qualityFollows),
  };
}
