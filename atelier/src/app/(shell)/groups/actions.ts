"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { GROUP_SLUG_RE, slugifyGroupName } from "@/lib/groups/types";
import { conflictingInstitution } from "@/lib/groups/institutionGuard";
import { parseDisciplines } from "@atelier/core/taxonomy/disciplines";
import { getPostHog } from "@/lib/analytics/posthog";

/* Group lifecycle server actions. Form-friendly: they take FormData and
   redirect with query flags; RLS enforces every rule a second time. */

async function requireUser() {
  const supabase = await createServerSupabase();
  if (!supabase) return { supabase: null, user: null } as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user } as const;
}

export async function createGroup(formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) redirect("/groups?error=unavailable");

  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const description = String(formData.get("description") ?? "")
    .trim()
    .slice(0, 600);
  const is_private = formData.get("is_private") === "on";
  const interests = parseDisciplines(formData.getAll("interests").map(String));
  const discussion_read =
    formData.get("discussion_read") === "public" ? "public" : "members";
  const modeRaw = String(formData.get("discussion_mode") ?? "open");
  const discussion_mode = ["open", "announce", "broadcast"].includes(modeRaw)
    ? modeRaw
    : "open";

  const slug = slugifyGroupName(name);
  if (name.length < 3 || !GROUP_SLUG_RE.test(slug)) {
    redirect("/groups?error=name");
  }

  // Institution-name protection: only an institution (or its manager) may use
  // that institution's name in a group name. Enforced again by the 0029 trigger.
  const { data: institutions } = await supabase
    .from("profiles")
    .select("id, display_name, managed_by")
    .eq("account_type", "institution");
  if (conflictingInstitution(name, user.id, institutions ?? [])) {
    redirect("/groups?error=protected-name");
  }

  const base = { name, slug, description, is_private, created_by: user.id };
  let ins = await supabase
    .from("groups")
    .insert({ ...base, interests, discussion_read, discussion_mode })
    .select("id, slug")
    .single();
  // If the interests column isn't there yet (pre-0018), retry without it.
  if (ins.error && !ins.error.code?.startsWith("23")) {
    ins = await supabase.from("groups").insert(base).select("id, slug").single();
  }
  const { data: group, error } = ins;
  if (error || !group) {
    redirect(error?.code === "23505" ? "/groups?error=taken" : "/groups?error=create");
  }

  // Bootstrap owner membership (RLS: creator-only path).
  await supabase
    .from("group_members")
    .insert({ group_id: group.id, profile_id: user.id, role: "owner" });

  const ph = await getPostHog();
  if (ph) {
    ph.capture({
      distinctId: user.id,
      event: "group_created",
      properties: {
        group_id: group.id,
        is_private,
        discussion_mode,
        discipline_count: interests.length,
      },
    });
    await ph.flush();
  }

  revalidatePath("/groups");
  redirect(`/g/${group.slug}`);
}

export async function inviteToGroup(formData: FormData) {
  const { supabase, user } = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  if (!supabase || !user) redirect(`/g/${slug}?error=unavailable`);

  const handle = String(formData.get("handle") ?? "").trim().toLowerCase();
  const groupId = String(formData.get("group_id") ?? "");

  // Server-side guard: inviter must be a member (RLS re-checks).
  const { data: membership } = await supabase
    .from("group_members")
    .select("profile_id")
    .eq("group_id", groupId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!membership) redirect(`/g/${slug}?error=not-member`);

  const { data: invitee } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();
  if (!invitee) redirect(`/g/${slug}?error=no-such-user`);

  const { error } = await supabase.from("group_invites").insert({
    group_id: groupId,
    invitee_id: invitee.id,
    inviter_id: user.id,
  });
  if (error && error.code !== "23505") redirect(`/g/${slug}?error=invite`);

  revalidatePath(`/g/${slug}`);
  redirect(`/g/${slug}?invited=1`);
}

export async function acceptInvite(formData: FormData) {
  const { supabase, user } = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  if (!supabase || !user) redirect(`/g/${slug}?error=unavailable`);
  const groupId = String(formData.get("group_id") ?? "");

  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, profile_id: user.id, role: "member" });
  if (error && error.code !== "23505") redirect(`/g/${slug}?error=join`);

  await supabase
    .from("group_invites")
    .delete()
    .eq("group_id", groupId)
    .eq("invitee_id", user.id);

  const ph = await getPostHog();
  if (ph) {
    ph.capture({
      distinctId: user.id,
      event: "group_joined",
      properties: { group_id: groupId, via: "invite" },
    });
    await ph.flush();
  }

  revalidatePath(`/g/${slug}`);
  redirect(`/g/${slug}?joined=1`);
}

export async function requestToJoin(formData: FormData) {
  const { supabase, user } = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  if (!supabase || !user) redirect(`/g/${slug}?error=unavailable`);
  const groupId = String(formData.get("group_id") ?? "");

  const { error } = await supabase
    .from("group_join_requests")
    .insert({ group_id: groupId, requester_id: user.id });
  if (error && error.code !== "23505") redirect(`/g/${slug}?error=request`);

  revalidatePath(`/g/${slug}`);
  redirect(`/g/${slug}?requested=1`);
}

export async function approveRequest(formData: FormData) {
  const { supabase, user } = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  if (!supabase || !user) redirect(`/g/${slug}?error=unavailable`);
  const groupId = String(formData.get("group_id") ?? "");
  const requesterId = String(formData.get("requester_id") ?? "");

  // Owner guard (RLS enforces again via the owner-approval insert path).
  const { data: owner } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("profile_id", user.id)
    .eq("role", "owner")
    .maybeSingle();
  if (!owner) redirect(`/g/${slug}?error=not-owner`);

  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, profile_id: requesterId, role: "member" });
  if (error && error.code !== "23505") redirect(`/g/${slug}?error=approve`);

  await supabase
    .from("group_join_requests")
    .delete()
    .eq("group_id", groupId)
    .eq("requester_id", requesterId);

  revalidatePath(`/g/${slug}`);
  redirect(`/g/${slug}?approved=1`);
}

export async function followGroup(formData: FormData) {
  const { supabase, user } = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  if (!supabase || !user) redirect(`/g/${slug}?error=unavailable`);
  const groupId = String(formData.get("group_id") ?? "");

  const { error } = await supabase
    .from("group_followers")
    .insert({ group_id: groupId, profile_id: user.id });
  if (error && error.code !== "23505") redirect(`/g/${slug}?error=follow`);

  revalidatePath(`/g/${slug}`);
  redirect(`/g/${slug}`);
}

export async function unfollowGroup(formData: FormData) {
  const { supabase, user } = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  if (!supabase || !user) redirect(`/g/${slug}?error=unavailable`);
  const groupId = String(formData.get("group_id") ?? "");

  await supabase
    .from("group_followers")
    .delete()
    .eq("group_id", groupId)
    .eq("profile_id", user.id);

  revalidatePath(`/g/${slug}`);
  redirect(`/g/${slug}`);
}
