"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  JOB_DISCIPLINES,
  JOB_STATUSES,
  WORK_MODES,
} from "@/lib/jobs/types";

/* Job management server actions. Owner-only; RLS re-checks. */

export async function createJob(formData: FormData) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/profile/jobs?error=unavailable");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const discipline = String(formData.get("discipline") ?? "");
  const description = String(formData.get("description") ?? "").trim().slice(0, 2000);
  const location = String(formData.get("location") ?? "").trim().slice(0, 120);
  const work_mode = String(formData.get("work_mode") ?? "remote");
  const compensation =
    String(formData.get("compensation") ?? "").trim().slice(0, 120) || "Negotiable";
  const rawUrl = String(formData.get("apply_url") ?? "").trim();

  if (title.length < 3) redirect("/profile/jobs?error=title");
  if (!JOB_DISCIPLINES.includes(discipline as (typeof JOB_DISCIPLINES)[number])) {
    redirect("/profile/jobs?error=discipline");
  }
  const apply_url = rawUrl === "" ? null : rawUrl;
  if (apply_url && !/^https?:\/\//i.test(apply_url)) {
    redirect("/profile/jobs?error=url");
  }

  const { error } = await supabase.from("job_posts").insert({
    profile_id: user.id,
    title,
    discipline,
    description,
    location,
    work_mode: WORK_MODES.includes(work_mode as (typeof WORK_MODES)[number])
      ? work_mode
      : "remote",
    compensation,
    apply_url,
  });
  if (error) redirect("/profile/jobs?error=create");

  revalidatePath("/profile/jobs");
  revalidatePath("/jobs");
  redirect("/profile/jobs?created=1");
}

/** Open / filled / closed — the poster's switch. */
export async function setJobStatus(formData: FormData) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/profile/jobs?error=unavailable");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!JOB_STATUSES.includes(status as (typeof JOB_STATUSES)[number])) {
    redirect("/profile/jobs?error=status");
  }

  await supabase
    .from("job_posts")
    .update({ status })
    .eq("id", id)
    .eq("profile_id", user.id); // own rows only; RLS re-checks

  revalidatePath("/profile/jobs");
  revalidatePath("/jobs");
  redirect("/profile/jobs");
}
