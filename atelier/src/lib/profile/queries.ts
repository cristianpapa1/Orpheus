import { toSchool } from "@atelier/core/design/schools";
import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_PROFILES, DEMO_SELF } from "./demo";
import { parseLayout } from "@atelier/core/profile/layout";
import {
  accountType,
  isInstitutionKind,
  parseContacts,
  parseInterests,
  type AccountType,
  type InstitutionKind,
  type PublicProfile,
} from "@atelier/core/profile/types";

/* Server-side profile reads. Preview mode (no Supabase) serves demo data. */

type ProfileRow = {
  id: string;
  handle: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  links: unknown;
  layout: unknown;
  accent?: string | null;
  school?: string | null;
  account_type?: string | null;
  institution_kind?: string | null;
  interests?: unknown;
};

const toAccent = (v: unknown): "red" | "blue" | "yellow" =>
  v === "blue" || v === "yellow" ? v : "red";

function toPublicProfile(row: ProfileRow, followerCount: number): PublicProfile {
  return {
    id: row.id,
    handle: row.handle ?? "",
    display_name: row.display_name ?? row.handle ?? "Unnamed",
    bio: row.bio ?? "",
    avatar_url: row.avatar_url,
    contacts: parseContacts(row.links),
    layout: parseLayout(row.layout),
    accent: toAccent(row.accent),
    school: toSchool(row.school),
    account_type: accountType(row.account_type),
    institution_kind: isInstitutionKind(row.institution_kind)
      ? row.institution_kind
      : null,
    interests: parseInterests(row.interests),
    follower_count: followerCount,
  };
}

const PROFILE_COLUMNS =
  "id, handle, display_name, bio, avatar_url, links, layout, accent, school, account_type, institution_kind, interests";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function withFollowerCount(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>,
  data: ProfileRow,
): Promise<PublicProfile> {
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("followee_id", data.id);
  return toPublicProfile(data, count ?? 0);
}

export async function getProfileByHandle(
  handle: string,
): Promise<PublicProfile | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return DEMO_PROFILES[handle] ?? null;

  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("handle", handle)
    .maybeSingle();
  if (!data) return null;
  return withFollowerCount(supabase, data);
}

/** Resolve a profile by its uuid (used as a fallback for handle-less users). */
export async function getProfileById(
  id: string,
): Promise<PublicProfile | null> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return Object.values(DEMO_PROFILES).find((p) => p.id === id) ?? null;
  }
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return withFollowerCount(supabase, data);
}

/**
 * Resolve a `/u/[handle]` segment. Tries the handle first, then — if the
 * segment is a uuid — falls back to the id, so a user who has not yet chosen
 * a handle is still reachable by their stable id (fixes the cross-user 404).
 */
export async function getProfileByHandleOrId(
  handleOrId: string,
): Promise<PublicProfile | null> {
  const byHandle = await getProfileByHandle(handleOrId);
  if (byHandle) return byHandle;
  if (!UUID_RE.test(handleOrId)) return null;
  return getProfileById(handleOrId);
}

export async function getOwnProfile(): Promise<PublicProfile | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return DEMO_SELF;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;

  return toPublicProfile(data, 0);
}

/** Whether the signed-in viewer follows `targetId`. Preview mode: false. */
export async function isFollowing(targetId: string): Promise<boolean> {
  const supabase = await createServerSupabase();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("followee_id", targetId)
    .maybeSingle();
  return Boolean(data);
}

export interface OnboardingState {
  onboarded: boolean;
  /** Blank when the stored name is still just the sign-up email. */
  display_name: string;
  handle: string;
  account_type: AccountType;
  institution_kind: InstitutionKind | null;
  interests: string[];
  email: string | null;
}

/**
 * The signed-in user's onboarding snapshot — drives the /onboarding form and
 * its gate. Null in preview mode or when signed out (no onboarding there).
 */
export async function getOnboardingState(): Promise<OnboardingState | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("handle, display_name, account_type, institution_kind, interests, onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  const email = user.email ?? null;
  const storedName = (data?.display_name ?? "").trim();
  return {
    onboarded: Boolean(data?.onboarded_at),
    display_name: storedName && storedName !== email ? storedName : "",
    handle: data?.handle ?? "",
    account_type: accountType(data?.account_type),
    institution_kind: isInstitutionKind(data?.institution_kind)
      ? data.institution_kind
      : null,
    interests: parseInterests(data?.interests),
    email,
  };
}

export interface ProfileClaimState {
  is_seed: boolean;
  claimed: boolean;
  managed_by: string | null;
}

const CLAIM_OFF: ProfileClaimState = {
  is_seed: false,
  claimed: false,
  managed_by: null,
};

/**
 * Claim/management state of a profile. Reads the 0014 columns defensively —
 * if the migration hasn't been applied yet the query errors and we report the
 * feature as off, so the site never breaks between deploy and migration.
 */
export async function getProfileClaimState(
  profileId: string,
): Promise<ProfileClaimState> {
  const supabase = await createServerSupabase();
  if (!supabase) return CLAIM_OFF;
  const { data, error } = await supabase
    .from("profiles")
    .select("is_seed, claimed_at, managed_by")
    .eq("id", profileId)
    .maybeSingle();
  if (error || !data) return CLAIM_OFF;
  return {
    is_seed: Boolean(data.is_seed),
    claimed: Boolean(data.claimed_at),
    managed_by: data.managed_by ?? null,
  };
}

export interface ManagedProfile {
  id: string;
  handle: string;
  display_name: string;
}

/** Institution profiles the signed-in user manages (post-claim). Defensive. */
export async function getManagedProfiles(): Promise<ManagedProfile[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, handle, display_name")
    .eq("managed_by", user.id);
  if (error || !data) return [];
  return data.map((p) => ({
    id: p.id,
    handle: p.handle ?? "",
    display_name: p.display_name ?? p.handle ?? "Unnamed",
  }));
}

export interface PendingClaim {
  profile_id: string;
  claimant_id: string;
  message: string;
  created_at: string;
  profile_handle: string;
  profile_name: string;
  claimant_handle: string;
  claimant_name: string;
}

/** Pending claims for the admin review queue. Defensive; [] pre-migration. */
export async function getPendingClaims(): Promise<PendingClaim[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profile_claims")
    .select(
      "profile_id, claimant_id, message, created_at, profile:profiles!profile_claims_profile_id_fkey(handle, display_name), claimant:profiles!profile_claims_claimant_id_fkey(handle, display_name)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as unknown as {
    profile_id: string;
    claimant_id: string;
    message: string;
    created_at: string;
    profile: { handle: string | null; display_name: string | null } | null;
    claimant: { handle: string | null; display_name: string | null } | null;
  }[]).map((c) => ({
    profile_id: c.profile_id,
    claimant_id: c.claimant_id,
    message: c.message,
    created_at: c.created_at,
    profile_handle: c.profile?.handle ?? "",
    profile_name: c.profile?.display_name ?? c.profile?.handle ?? "Unnamed",
    claimant_handle: c.claimant?.handle ?? "",
    claimant_name: c.claimant?.display_name ?? c.claimant?.handle ?? "Unnamed",
  }));
}

export interface ResolvedClaim extends PendingClaim {
  status: "approved" | "rejected" | "revoked";
  resolved_at: string | null;
}

/** Resolved claims (approved/rejected/revoked) for the admin history. Defensive. */
export async function getResolvedClaims(limit = 50): Promise<ResolvedClaim[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profile_claims")
    .select(
      "profile_id, claimant_id, message, created_at, status, resolved_at, profile:profiles!profile_claims_profile_id_fkey(handle, display_name), claimant:profiles!profile_claims_claimant_id_fkey(handle, display_name)",
    )
    .neq("status", "pending")
    .order("resolved_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as unknown as {
    profile_id: string;
    claimant_id: string;
    message: string;
    created_at: string;
    status: "approved" | "rejected" | "revoked";
    resolved_at: string | null;
    profile: { handle: string | null; display_name: string | null } | null;
    claimant: { handle: string | null; display_name: string | null } | null;
  }[]).map((c) => ({
    profile_id: c.profile_id,
    claimant_id: c.claimant_id,
    message: c.message,
    created_at: c.created_at,
    status: c.status,
    resolved_at: c.resolved_at,
    profile_handle: c.profile?.handle ?? "",
    profile_name: c.profile?.display_name ?? c.profile?.handle ?? "Unnamed",
    claimant_handle: c.claimant?.handle ?? "",
    claimant_name: c.claimant?.display_name ?? c.claimant?.handle ?? "Unnamed",
  }));
}

export interface FollowedProfile {
  id: string;
  handle: string;
  display_name: string;
  account_type: AccountType;
  institution_kind: InstitutionKind | null;
}

/** Profiles the signed-in user follows (creators + institutions). */
export async function getFollowing(): Promise<FollowedProfile[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: rows } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", user.id);
  const ids = (rows ?? []).map((r) => r.followee_id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id, handle, display_name, account_type, institution_kind")
    .in("id", ids)
    .order("display_name");
  return ((data ?? []) as {
    id: string;
    handle: string | null;
    display_name: string | null;
    account_type: string | null;
    institution_kind: string | null;
  }[]).map((p) => ({
    id: p.id,
    handle: p.handle ?? "",
    display_name: p.display_name ?? p.handle ?? "Unnamed",
    account_type: accountType(p.account_type),
    institution_kind: isInstitutionKind(p.institution_kind)
      ? p.institution_kind
      : null,
  }));
}

export async function getViewerId(): Promise<string | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export interface MutualFollow {
  id: string;
  handle: string;
  display_name: string;
}

/**
 * People the signed-in user MUTUALLY follows (each follows the other) — the
 * only people taggable in a post. Empty in preview / when signed out.
 */
export async function getMutualFollows(): Promise<MutualFollow[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: iFollow } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", user.id);
  const followeeIds = (iFollow ?? []).map((r) => r.followee_id);
  if (followeeIds.length === 0) return [];

  const { data: followBack } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("followee_id", user.id)
    .in("follower_id", followeeIds);
  const mutualIds = (followBack ?? []).map((r) => r.follower_id);
  if (mutualIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, handle, display_name")
    .in("id", mutualIds);
  return ((profiles ?? []) as {
    id: string;
    handle: string | null;
    display_name: string | null;
  }[]).map((p) => ({
    id: p.id,
    handle: p.handle ?? "",
    display_name: p.display_name ?? p.handle ?? "Unnamed",
  }));
}
