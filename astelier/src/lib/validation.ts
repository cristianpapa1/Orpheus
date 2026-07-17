import { createServerSupabase } from "@/lib/supabase/server";

const ATELIER_URL =
  process.env.NEXT_PUBLIC_ATELIER_URL ?? "https://atelier.aunflaneur.com";

/**
 * Institution-validation state that gates the catalog crawler.
 *
 * The crawler ("Import from your shop") scrapes a shop's own site, so it is
 * reserved for the person proven to own that shop — the *validated institution*.
 * On Atelier that proof is the claim system: an admin approves a claim on a
 * seeded institution profile, which sets `profiles.managed_by` + `claimed_at`.
 * Astelier shares Atelier's Supabase project, so it reads that state directly.
 *
 * - `validated` — the user manages a claimed institution → crawler unlocked.
 * - `pending`   — a claim is awaiting admin review → crawler still locked.
 * - `none`      — no claim yet → crawler locked, with a path to get validated.
 */
export type ValidationStatus = "validated" | "pending" | "none" | "signed_out";

export interface ManagedInstitution {
  handle: string;
  display_name: string;
}

export interface InstitutionValidation {
  status: ValidationStatus;
  /** Institutions the user is validated to manage (claim approved). */
  institutions: ManagedInstitution[];
  /** Institutions the user has a claim pending admin review on. */
  pending: ManagedInstitution[];
  /** Where to go on Atelier to get (or check) validation. */
  ctaUrl: string;
}

function named(row: { handle?: string | null; display_name?: string | null }): ManagedInstitution {
  const handle = row.handle ?? "";
  return { handle, display_name: row.display_name ?? handle ?? "your institution" };
}

/**
 * Read the signed-in user's institution-validation state from the shared
 * profiles / profile_claims tables. Defensive throughout: any missing column or
 * table (or query error) resolves to a *locked* state — a gate must fail closed,
 * never fall open — so the sell page still renders and the crawler stays gated.
 */
export async function getInstitutionValidation(): Promise<InstitutionValidation> {
  const searchCta = `${ATELIER_URL}/search`;
  const signedOut: InstitutionValidation = {
    status: "signed_out",
    institutions: [],
    pending: [],
    ctaUrl: searchCta,
  };

  const supabase = await createServerSupabase();
  if (!supabase) return signedOut;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return signedOut;

  // Institutions this user has been validated to manage (claim approved sets
  // both managed_by and claimed_at together).
  const { data: managed } = await supabase
    .from("profiles")
    .select("handle, display_name")
    .eq("managed_by", user.id)
    .not("claimed_at", "is", null);

  const institutions = (managed ?? []).map(named);
  if (institutions.length) {
    return { status: "validated", institutions, pending: [], ctaUrl: searchCta };
  }

  // Not validated yet — is a claim awaiting admin review? (RLS scopes this row
  // to the claimant, i.e. the signed-in user.)
  const { data: claims } = await supabase
    .from("profile_claims")
    .select("profile_id")
    .eq("claimant_id", user.id)
    .eq("status", "pending");

  const ids = (claims ?? []).map((c) => c.profile_id).filter(Boolean);
  if (ids.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("handle, display_name")
      .in("id", ids);
    const pending = (profs ?? []).map(named);
    if (pending.length) {
      const first = pending[0];
      const ctaUrl = first.handle ? `${ATELIER_URL}/u/${first.handle}` : searchCta;
      return { status: "pending", institutions: [], pending, ctaUrl };
    }
  }

  return { status: "none", institutions: [], pending: [], ctaUrl: searchCta };
}

/** Server-side crawler authorization — true only when the user is validated. */
export async function isCrawlerAuthorized(): Promise<boolean> {
  const v = await getInstitutionValidation();
  return v.status === "validated";
}

/**
 * Whether the signed-in user is an Atelier curator. Curators are tastemakers,
 * not sellers — the curator badge and owning an Astelier shop are mutually
 * exclusive. Reads the shared `is_curator()` function (same Supabase project).
 * Defensive: any error (feature not migrated) → false, so selling stays open.
 */
export async function isViewerCurator(): Promise<boolean> {
  const supabase = await createServerSupabase();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase.rpc("is_curator", { uid: user.id });
  if (error) return false;
  return Boolean(data);
}

/**
 * Whether the signed-in user is an APPROVED creator on Atelier. Opening an
 * Astelier shop is for makers who sell what they make — common members
 * (unapproved), curators, and visitors browse and buy, they don't sell.
 * Reads the shared `profiles.creator_status`. Defensive: unknown → false.
 */
export async function isViewerCreator(): Promise<boolean> {
  const supabase = await createServerSupabase();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("creator_status")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return false;
  return data.creator_status === "approved";
}
