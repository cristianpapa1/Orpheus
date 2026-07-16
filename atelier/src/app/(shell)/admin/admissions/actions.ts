"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isViewerAdmin } from "@/lib/donations/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { notify } from "@/lib/notifications/notify";

/* Admin-only creator admissions. Approving flips the applicant's creator_status
   to 'approved' (service role — the guard trigger blocks user self-writes),
   notifies them in-app, and emails them. Both writes go through the service
   client because an admin doesn't own the applicant's row. */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://atelier.aunflaneur.com";

type Admin = NonNullable<ReturnType<typeof createServiceClient>>;

/** Email the applicant that they're now a creator. Best-effort. */
async function emailApproved(admin: Admin, profileId: string): Promise<void> {
  const [{ data: prof }, userRes] = await Promise.all([
    admin.from("profiles").select("handle, display_name").eq("id", profileId).maybeSingle(),
    admin.auth.admin.getUserById(profileId),
  ]);
  const email = userRes.data.user?.email;
  if (!email) return;
  const name = prof?.display_name ?? prof?.handle ?? "there";
  const postUrl = `${SITE_URL}/post/new`;
  await sendEmail({
    to: email,
    subject: "You're a creator on Atelier",
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.5">
      <h2 style="text-transform:uppercase;letter-spacing:.02em">Welcome in, ${name}</h2>
      <p>Your creator application on Atelier has been approved. You can now publish work and start groups.</p>
      <p><a href="${postUrl}" style="display:inline-block;border:2px solid #111;padding:8px 16px;font-weight:700;text-transform:uppercase;text-decoration:none;color:#111">Post your first work →</a></p>
      <p style="opacity:.7">Make something worth stumbling on.</p>
    </div>`,
    text: `Your creator application on Atelier was approved — you can now post and create groups. Start here: ${postUrl}`,
  });
}

export async function approveCreator(formData: FormData) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/admin/admissions?error=unavailable");
  if (!(await isViewerAdmin())) redirect("/admin/admissions?error=forbidden");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const appId = String(formData.get("application_id") ?? "");
  const profileId = String(formData.get("profile_id") ?? "");
  if (!appId || !profileId) redirect("/admin/admissions?error=bad");

  const admin = createServiceClient();
  if (!admin) redirect("/admin/admissions?error=service");
  const now = new Date().toISOString();

  const { error: aErr } = await admin
    .from("creator_applications")
    .update({ status: "approved", reviewed_at: now, reviewed_by: user.id })
    .eq("id", appId);
  if (aErr) redirect("/admin/admissions?error=resolve");

  const { error: pErr } = await admin
    .from("profiles")
    .update({ creator_status: "approved" })
    .eq("id", profileId);
  if (pErr) redirect("/admin/admissions?error=assign");

  await emailApproved(admin, profileId); // best-effort
  await notify(supabase, {
    actorId: user.id,
    recipientId: profileId,
    type: "creator_approved",
    subjectType: "profile",
    subjectId: profileId,
  });

  revalidatePath("/admin/admissions");
  redirect("/admin/admissions?approved=1");
}

export async function rejectCreator(formData: FormData) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/admin/admissions?error=unavailable");
  if (!(await isViewerAdmin())) redirect("/admin/admissions?error=forbidden");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const appId = String(formData.get("application_id") ?? "");
  const profileId = String(formData.get("profile_id") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  if (!appId || !profileId) redirect("/admin/admissions?error=bad");

  const admin = createServiceClient();
  if (!admin) redirect("/admin/admissions?error=service");
  const now = new Date().toISOString();

  const { error: aErr } = await admin
    .from("creator_applications")
    .update({ status: "rejected", reviewed_at: now, reviewed_by: user.id, review_note: note })
    .eq("id", appId);
  if (aErr) redirect("/admin/admissions?error=resolve");

  // Only downgrade if they aren't already approved from another route.
  await admin
    .from("profiles")
    .update({ creator_status: "rejected" })
    .eq("id", profileId)
    .neq("creator_status", "approved");

  await notify(supabase, {
    actorId: user.id,
    recipientId: profileId,
    type: "creator_rejected",
    subjectType: "profile",
    subjectId: profileId,
  });

  revalidatePath("/admin/admissions");
  redirect("/admin/admissions?rejected=1");
}
