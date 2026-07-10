import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_APPEAL, DEMO_APPEAL_RESULTS, DEMO_LEDGER } from "./demo";
import type { Appeal, AppealResults, DonationEntry } from "@atelier/core/donations/types";

/* Donation/appeal reads. Preview mode serves the demo appeal + ledger. */

export async function isViewerAdmin(): Promise<boolean> {
  const supabase = await createServerSupabase();
  if (!supabase) return true; // preview mode: admin surface explorable with demo data
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return Boolean(data?.is_admin);
}

/** The single most recent active appeal — powers the shell banner. */
export async function getActiveAppeal(): Promise<Appeal | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return DEMO_APPEAL;
  const { data } = await supabase
    .from("appeals")
    .select("id, title, message, goal_cents, audience, active, created_at")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Appeal | null) ?? null;
}

export async function getRaisedForAppeal(appealId: string): Promise<number> {
  const supabase = await createServerSupabase();
  if (!supabase) return DEMO_APPEAL_RESULTS.raised_cents;
  const { data } = await supabase
    .from("donations")
    .select("amount_cents")
    .eq("appeal_id", appealId)
    .eq("status", "succeeded");
  return (data ?? []).reduce((sum, d) => sum + d.amount_cents, 0);
}

/** All appeals with results (admin view). Reach is an estimate by audience. */
export async function getAppealsWithResults(): Promise<AppealResults[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [DEMO_APPEAL_RESULTS];

  const { data: appeals } = await supabase
    .from("appeals")
    .select("id, title, message, goal_cents, audience, active, created_at")
    .order("created_at", { ascending: false });

  const results: AppealResults[] = [];
  for (const appeal of (appeals ?? []) as Appeal[]) {
    const [{ data: donations }, reach] = await Promise.all([
      supabase
        .from("donations")
        .select("amount_cents")
        .eq("appeal_id", appeal.id)
        .eq("status", "succeeded"),
      estimateReach(appeal.audience),
    ]);
    const rows = donations ?? [];
    results.push({
      ...appeal,
      raised_cents: rows.reduce((s, d) => s + d.amount_cents, 0),
      donation_count: rows.length,
      reach,
    });
  }
  return results;
}

async function estimateReach(
  audience: Appeal["audience"],
): Promise<number> {
  const supabase = await createServerSupabase();
  if (!supabase) return DEMO_APPEAL_RESULTS.reach;
  if (audience === "past_donors") {
    const { data } = await supabase
      .from("donations")
      .select("donor_id")
      .not("donor_id", "is", null);
    return new Set((data ?? []).map((d) => d.donor_id)).size;
  }
  // everyone / active_users: profile count (activity windows arrive with analytics in Phase 9)
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

/** Recent donations ledger (admin view). */
export async function getLedger(limit = 50): Promise<DonationEntry[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return DEMO_LEDGER;

  const { data } = await supabase
    .from("donations")
    .select(
      "id, amount_cents, currency, kind, status, created_at, donor:profiles(handle)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as {
    id: string;
    amount_cents: number;
    currency: string;
    kind: "one_off" | "recurring";
    status: string;
    created_at: string;
    donor: { handle: string | null } | null;
  }[]).map((d) => ({
    id: d.id,
    amount_cents: d.amount_cents,
    currency: d.currency,
    kind: d.kind,
    status: d.status,
    donor_label: d.donor?.handle ? `@${d.donor.handle}` : "anonymous",
    created_at: d.created_at,
  }));
}
