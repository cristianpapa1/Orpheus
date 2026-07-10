"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  RATE_LIMITS,
  REPORT_REASONS,
  REPORT_SUBJECTS,
  type ReportReason,
  type ReportSubject,
} from "./types";

/** File a report. Rate-limited to keep the queue humane. */
export async function createReport(formData: FormData) {
  const backTo = String(formData.get("back_to") ?? "/feed");
  const supabase = await createServerSupabase();
  if (!supabase) redirect(`${backTo}?error=unavailable`);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const subject_type = String(formData.get("subject_type") ?? "");
  const subject_id = String(formData.get("subject_id") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const detail = String(formData.get("detail") ?? "").trim().slice(0, 600);

  if (
    !REPORT_SUBJECTS.includes(subject_type as ReportSubject) ||
    !REPORT_REASONS.includes(reason as ReportReason) ||
    !subject_id
  ) {
    redirect(`${backTo}?error=report`);
  }

  // Rate limit: ≤20 reports per day per user.
  const dayAgo = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("reporter_id", user.id)
    .gte("created_at", dayAgo);
  if ((count ?? 0) >= RATE_LIMITS.reports_per_day) {
    redirect(`${backTo}?error=rate-limit`);
  }

  await supabase.from("reports").insert({
    reporter_id: user.id,
    subject_type,
    subject_id,
    reason,
    detail,
  });

  redirect(`${backTo}?reported=1`);
}

export async function blockUser(formData: FormData) {
  const handle = String(formData.get("handle") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  const supabase = await createServerSupabase();
  if (!supabase) redirect(`/u/${handle}?error=unavailable`);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.id === targetId) redirect(`/u/${handle}?error=self`);

  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: user.id, blocked_id: targetId });
  if (error && error.code !== "23505") redirect(`/u/${handle}?error=block`);

  revalidatePath(`/u/${handle}`);
  revalidatePath("/feed");
  redirect(`/u/${handle}`);
}

export async function unblockUser(formData: FormData) {
  const handle = String(formData.get("handle") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  const supabase = await createServerSupabase();
  if (!supabase) redirect(`/u/${handle}?error=unavailable`);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetId);

  revalidatePath(`/u/${handle}`);
  revalidatePath("/feed");
  redirect(`/u/${handle}`);
}

/** Moderation queue transitions (admin-only; RLS re-checks). */
export async function setReportStatus(formData: FormData) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/admin/reports?error=unavailable");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["reviewed", "dismissed", "actioned", "open"].includes(status)) {
    redirect("/admin/reports?error=status");
  }

  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", id);
  if (error) redirect("/admin/reports?error=update");

  revalidatePath("/admin/reports");
  redirect("/admin/reports");
}
