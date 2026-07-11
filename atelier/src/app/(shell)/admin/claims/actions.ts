"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isViewerAdmin } from "@/lib/donations/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

/* Admin-only claim resolution. Approving hands the seeded profile to the
   claimant via managed_by (service role — an admin doesn't own that row). */

export async function resolveClaim(formData: FormData) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/admin/claims?error=unavailable");
  if (!(await isViewerAdmin())) redirect("/admin/claims?error=forbidden");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profileId = String(formData.get("profile_id") ?? "");
  const claimantId = String(formData.get("claimant_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approve" && decision !== "reject") {
    redirect("/admin/claims?error=bad");
  }

  const now = new Date().toISOString();

  const { error: cErr } = await supabase
    .from("profile_claims")
    .update({
      status: decision === "approve" ? "approved" : "rejected",
      resolved_at: now,
      resolved_by: user.id,
    })
    .eq("profile_id", profileId)
    .eq("claimant_id", claimantId);
  if (cErr) redirect("/admin/claims?error=resolve");

  if (decision === "approve") {
    const admin = createServiceClient();
    if (!admin) redirect("/admin/claims?error=service");
    const { error: pErr } = await admin
      .from("profiles")
      .update({ managed_by: claimantId, claimed_at: now })
      .eq("id", profileId);
    if (pErr) redirect("/admin/claims?error=assign");
    // Any other pending claims on this profile are now moot.
    await admin
      .from("profile_claims")
      .update({ status: "rejected", resolved_at: now, resolved_by: user.id })
      .eq("profile_id", profileId)
      .eq("status", "pending");
  }

  revalidatePath("/admin/claims");
  redirect("/admin/claims?resolved=1");
}
