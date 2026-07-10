import { createServerSupabase } from "@/lib/supabase/server";
import type { Report } from "@atelier/core/moderation/types";

/** Demo reports for the preview-mode moderation queue. */
const DEMO_REPORTS: Report[] = [
  {
    id: "demo-report-1",
    reporter_handle: "theo",
    subject_type: "post",
    subject_id: "demo-ines-3",
    reason: "other",
    detail: "Demo report — shows how the queue works.",
    status: "open",
    created_at: "2026-07-09T08:00:00Z",
  },
];

export async function getReports(limit = 100): Promise<Report[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return DEMO_REPORTS;

  const { data } = await supabase
    .from("reports")
    .select(
      "id, subject_type, subject_id, reason, detail, status, created_at, reporter:profiles(handle)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as (Omit<Report, "reporter_handle"> & {
    reporter: { handle: string | null } | null;
  })[]).map((r) => ({
    ...r,
    reporter_handle: r.reporter?.handle ?? "unknown",
  }));
}

/** Profile ids the signed-in user has blocked. Preview: none. */
export async function getBlockedIds(): Promise<string[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id);
  return (data ?? []).map((b) => b.blocked_id);
}

export async function isBlocked(targetId: string): Promise<boolean> {
  const ids = await getBlockedIds();
  return ids.includes(targetId);
}
