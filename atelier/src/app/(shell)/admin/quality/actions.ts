"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isViewerAdmin } from "@/lib/donations/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notifications/notify";

async function adminUser() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/admin/quality?error=unavailable");
  if (!(await isViewerAdmin())) redirect("/admin/quality?error=forbidden");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const admin = createServiceClient();
  if (!admin) redirect("/admin/quality?error=service");
  return { supabase, admin, userId: user.id };
}

/** Grant a quality stamp — the member becomes a trusted reviewer. */
export async function grantQualityStamp(formData: FormData) {
  const { supabase, admin, userId } = await adminUser();
  const profileId = String(formData.get("profile_id") ?? "");
  const { error } = await admin
    .from("profiles")
    .update({
      quality_stamp: true,
      quality_stamped_at: new Date().toISOString(),
      quality_stamped_by: userId,
    })
    .eq("id", profileId);
  if (error) redirect("/admin/quality?error=grant");
  await notify(supabase, {
    actorId: userId,
    recipientId: profileId,
    type: "quality_stamp",
    subjectType: "profile",
    subjectId: profileId,
  });
  revalidatePath("/admin/quality");
  redirect("/admin/quality?granted=1");
}

/** Revoke a quality stamp. */
export async function revokeQualityStamp(formData: FormData) {
  const { admin } = await adminUser();
  const profileId = String(formData.get("profile_id") ?? "");
  const { error } = await admin
    .from("profiles")
    .update({
      quality_stamp: false,
      quality_stamped_at: null,
      quality_stamped_by: null,
    })
    .eq("id", profileId);
  if (error) redirect("/admin/quality?error=revoke");
  revalidatePath("/admin/quality");
  redirect("/admin/quality?revoked=1");
}
