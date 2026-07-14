"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isViewerAdmin } from "@/lib/donations/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { notify } from "@/lib/notifications/notify";

/* Admin-only claim resolution. Approving hands the seeded profile to the
   claimant via managed_by (service role — an admin doesn't own that row) and
   emails them; revoking hands it back. */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://atelier.aunflaneur.com";

/** Email the claimant that they now manage the profile. Best-effort. */
async function notifyApproved(
  admin: NonNullable<ReturnType<typeof createServiceClient>>,
  profileId: string,
  claimantId: string,
): Promise<void> {
  const [{ data: prof }, userRes] = await Promise.all([
    admin.from("profiles").select("handle, display_name").eq("id", profileId).maybeSingle(),
    admin.auth.admin.getUserById(claimantId),
  ]);
  const email = userRes.data.user?.email;
  if (!email || !prof) return;

  const name = prof.display_name ?? prof.handle ?? "the profile";
  const editUrl = `${SITE_URL}/profile/edit?as=${prof.handle ?? ""}`;
  const publicUrl = `${SITE_URL}/u/${prof.handle ?? ""}`;
  await sendEmail({
    to: email,
    subject: `Your claim for ${name} was approved`,
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.5">
      <h2 style="text-transform:uppercase;letter-spacing:.02em">You now manage ${name}</h2>
      <p>Your request to claim <strong>${name}</strong> (@${prof.handle ?? ""}) on Atelier has been approved.</p>
      <p>It stays a distinct profile — its own handle, posts, and groups — and you steer it now.</p>
      <p><a href="${editUrl}" style="display:inline-block;border:2px solid #111;padding:8px 16px;font-weight:700;text-transform:uppercase;text-decoration:none;color:#111">Edit the profile →</a></p>
      <p style="opacity:.7">Public page: <a href="${publicUrl}">${publicUrl}</a></p>
    </div>`,
    text: `You now manage ${name} (@${prof.handle ?? ""}) on Atelier. Edit it: ${editUrl}`,
  });
}

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
    await notifyApproved(admin, profileId, claimantId); // best-effort email
    await notify(supabase, {
      actorId: user.id,
      recipientId: claimantId,
      type: "claim_approved",
      subjectType: "profile",
      subjectId: profileId,
    });
  }

  revalidatePath("/admin/claims");
  redirect("/admin/claims?resolved=1");
}

/** Revoke an approved claim — hand the profile back (unmanaged, unclaimed). */
export async function revokeClaim(formData: FormData) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/admin/claims?error=unavailable");
  if (!(await isViewerAdmin())) redirect("/admin/claims?error=forbidden");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profileId = String(formData.get("profile_id") ?? "");
  const claimantId = String(formData.get("claimant_id") ?? "");

  const admin = createServiceClient();
  if (!admin) redirect("/admin/claims?error=service");

  const { error: pErr } = await admin
    .from("profiles")
    .update({ managed_by: null, claimed_at: null })
    .eq("id", profileId);
  if (pErr) redirect("/admin/claims?error=revoke");

  await admin
    .from("profile_claims")
    .update({
      status: "revoked",
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("profile_id", profileId)
    .eq("claimant_id", claimantId);

  revalidatePath("/admin/claims");
  redirect("/admin/claims?revoked=1");
}
