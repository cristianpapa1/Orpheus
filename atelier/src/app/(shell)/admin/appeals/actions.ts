"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isViewerAdmin } from "@/lib/donations/queries";
import { parseEurosToCents } from "@/lib/donations/types";
import { createServerSupabase } from "@/lib/supabase/server";

/* Admin-only appeal actions. RLS re-checks is_admin on every write. */

export async function createAppeal(formData: FormData) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/admin/appeals?error=unavailable");
  if (!(await isViewerAdmin())) redirect("/admin/appeals?error=forbidden");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const message = String(formData.get("message") ?? "").trim().slice(0, 600);
  const audience = String(formData.get("audience") ?? "everyone");
  const goalRaw = String(formData.get("goal") ?? "").trim();
  const goal_cents = goalRaw ? parseEurosToCents(goalRaw) : null;
  const active = formData.get("active") === "on";

  if (title.length < 3) redirect("/admin/appeals?error=title");
  if (goalRaw && goal_cents === null) redirect("/admin/appeals?error=goal");

  const { error } = await supabase.from("appeals").insert({
    title,
    message,
    goal_cents,
    audience: ["everyone", "past_donors", "active_users"].includes(audience)
      ? audience
      : "everyone",
    active,
    created_by: user.id,
  });
  if (error) redirect("/admin/appeals?error=create");

  revalidatePath("/admin/appeals");
  revalidatePath("/", "layout");
  redirect("/admin/appeals?created=1");
}

/** The manual on/off switch — appeals stop the moment the need passes. */
export async function toggleAppeal(formData: FormData) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/admin/appeals?error=unavailable");
  if (!(await isViewerAdmin())) redirect("/admin/appeals?error=forbidden");

  const id = String(formData.get("id") ?? "");
  const active = formData.get("next") === "on";

  const { error } = await supabase
    .from("appeals")
    .update({ active })
    .eq("id", id);
  if (error) redirect("/admin/appeals?error=toggle");

  revalidatePath("/admin/appeals");
  revalidatePath("/", "layout");
  redirect("/admin/appeals");
}
