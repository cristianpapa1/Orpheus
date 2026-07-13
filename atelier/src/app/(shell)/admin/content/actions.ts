"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isViewerAdmin } from "@/lib/donations/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

/* Admin content moderation — remove posts and groups directly (not only via a
   report). Admin-gated in the action AND uses the service role, since an admin
   doesn't own the rows they're removing. Deletes cascade (post_groups,
   post_mentions, group_members/followers, post tags). */

async function requireAdminClient() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/admin/content?error=unavailable");
  if (!(await isViewerAdmin())) redirect("/admin/content?error=forbidden");
  const admin = createServiceClient();
  if (!admin) redirect("/admin/content?error=service");
  return admin;
}

export async function removePost(formData: FormData) {
  const supabase = await createServerSupabase();
  const adminId = supabase ? (await supabase.auth.getUser()).data.user?.id : null;
  const admin = await requireAdminClient();
  const id = String(formData.get("id") ?? "");
  // Soft-delete: reversible + audited (removed_by/removed_at).
  const { error } = await admin
    .from("posts")
    .update({ removed_at: new Date().toISOString(), removed_by: adminId })
    .eq("id", id);
  if (error) redirect("/admin/content?error=post");
  revalidatePath("/admin/content");
  revalidatePath("/feed");
  redirect("/admin/content?removed=post");
}

export async function reinstatePost(formData: FormData) {
  const admin = await requireAdminClient();
  const id = String(formData.get("id") ?? "");
  const { error } = await admin
    .from("posts")
    .update({ removed_at: null, removed_by: null })
    .eq("id", id);
  if (error) redirect("/admin/content?error=post");
  revalidatePath("/admin/content");
  revalidatePath("/feed");
  redirect("/admin/content?reinstated=1");
}

export async function removeGroup(formData: FormData) {
  const admin = await requireAdminClient();
  const id = String(formData.get("id") ?? "");
  const { error } = await admin.from("groups").delete().eq("id", id);
  if (error) redirect("/admin/content?error=group");
  revalidatePath("/admin/content");
  revalidatePath("/groups");
  redirect("/admin/content?removed=group");
}
