"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

/* Event management server actions. Owner-only — RLS enforces again. */

export async function createEvent(formData: FormData) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/profile/events?error=unavailable");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const description = String(formData.get("description") ?? "")
    .trim()
    .slice(0, 600);
  const location = String(formData.get("location") ?? "").trim().slice(0, 120);
  const location_type =
    formData.get("location_type") === "online" ? "online" : "venue";
  const rawUrl = String(formData.get("ticket_url") ?? "").trim();
  const rawDate = String(formData.get("starts_at") ?? "");

  if (title.length < 3) redirect("/profile/events?error=title");
  const starts_at = new Date(rawDate);
  if (Number.isNaN(starts_at.getTime())) redirect("/profile/events?error=date");
  const ticket_url = rawUrl === "" ? null : rawUrl;
  if (ticket_url && !/^https?:\/\//i.test(ticket_url)) {
    redirect("/profile/events?error=url");
  }

  const { error } = await supabase.from("events").insert({
    profile_id: user.id,
    title,
    description,
    location,
    location_type,
    starts_at: starts_at.toISOString(),
    ticket_url,
  });
  if (error) redirect("/profile/events?error=create");

  revalidatePath("/profile/events");
  redirect("/profile/events?created=1");
}

export async function deleteEvent(formData: FormData) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/profile/events?error=unavailable");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  // Own-row guard (RLS re-checks).
  await supabase.from("events").delete().eq("id", id).eq("profile_id", user.id);

  revalidatePath("/profile/events");
  redirect("/profile/events");
}
