"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

const HANDLE_RE = /@([a-z0-9_]{3,30})/gi;

function extractHandles(body: string): string[] {
  const set = new Set<string>();
  for (const m of body.matchAll(HANDLE_RE)) set.add(m[1].toLowerCase());
  return [...set];
}

/** Post a message (or reply) in a group discussion. Membership + the group's
 *  mode are enforced by RLS; this also fans out notifications. */
export async function postGroupMessage(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const back = slug ? `/g/${slug}` : "/groups";
  const supabase = await createServerSupabase();
  if (!supabase) redirect(`${back}?derror=unavailable`);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const groupId = String(formData.get("group_id") ?? "");
  const parentId = String(formData.get("parent_id") ?? "") || null;
  const body = String(formData.get("body") ?? "").trim().slice(0, 4000);
  if (!groupId || !body) redirect(`${back}?derror=empty`);

  const { data: msg, error } = await supabase
    .from("group_messages")
    .insert({ group_id: groupId, author_id: user.id, parent_id: parentId, body })
    .select("id")
    .single();
  // RLS rejects when the mode/membership doesn't allow it.
  if (error || !msg) redirect(`${back}?derror=post`);

  // ── notifications ──────────────────────────────────────────────
  const recipients = new Set<string>();

  // Announcement fan-out: a top-level message in an announce/broadcast group
  // notifies every member (that's the point of announcements).
  const { data: group } = await supabase
    .from("groups")
    .select("discussion_mode")
    .eq("id", groupId)
    .maybeSingle();
  const mode = (group?.discussion_mode as string) ?? "open";
  if (!parentId && (mode === "announce" || mode === "broadcast")) {
    const { data: members } = await supabase
      .from("group_members")
      .select("profile_id")
      .eq("group_id", groupId);
    for (const m of members ?? []) recipients.add(m.profile_id as string);
  }

  // A reply notifies the message it answers.
  if (parentId) {
    const { data: parent } = await supabase
      .from("group_messages")
      .select("author_id")
      .eq("id", parentId)
      .maybeSingle();
    if (parent?.author_id) recipients.add(parent.author_id as string);
  }

  // Mentions notify the people named.
  const handles = extractHandles(body);
  if (handles.length) {
    const { data: mentioned } = await supabase
      .from("profiles")
      .select("id")
      .in("handle", handles);
    for (const p of mentioned ?? []) recipients.add(p.id as string);
  }

  recipients.delete(user.id); // never notify yourself
  if (recipients.size) {
    await supabase.from("notifications").insert(
      [...recipients].map((rid) => ({
        recipient_id: rid,
        actor_id: user.id,
        type: "group_message",
        subject_type: "group",
        subject_id: groupId,
      })),
    );
  }

  revalidatePath(back);
  redirect(back);
}

/** Soft-delete a discussion message — author or group owner (RLS enforces). */
export async function deleteGroupMessage(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const back = slug ? `/g/${slug}` : "/groups";
  const supabase = await createServerSupabase();
  if (!supabase) redirect(`${back}?derror=unavailable`);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase
      .from("group_messages")
      .update({ removed_at: new Date().toISOString(), removed_by: user.id })
      .eq("id", id);
  }
  revalidatePath(back);
  redirect(back);
}

/** Owner sets who can read/post the discussion. */
export async function updateGroupDiscussion(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const back = slug ? `/g/${slug}` : "/groups";
  const supabase = await createServerSupabase();
  if (!supabase) redirect(`${back}?derror=unavailable`);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const groupId = String(formData.get("group_id") ?? "");
  const read = formData.get("discussion_read") === "public" ? "public" : "members";
  const modeRaw = String(formData.get("discussion_mode") ?? "open");
  const mode = ["open", "announce", "broadcast"].includes(modeRaw) ? modeRaw : "open";

  // Owner-only.
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (membership?.role !== "owner") redirect(`${back}?derror=forbidden`);

  const admin = createServiceClient();
  if (admin) {
    await admin
      .from("groups")
      .update({ discussion_read: read, discussion_mode: mode })
      .eq("id", groupId);
  }
  revalidatePath(back);
  redirect(`${back}?dsaved=1`);
}
