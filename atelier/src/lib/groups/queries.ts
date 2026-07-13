import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_POSTS } from "@/lib/posts/demo";
import type { Post } from "@atelier/core/posts/types";
import {
  DEMO_GROUPS,
  DEMO_GROUP_MEMBERS,
  DEMO_GROUP_POSTS,
  DEMO_POST_GROUPS,
} from "./demo";
import type { Group, GroupMember, GroupRelation, GroupTag } from "./types";

/* Server-side group reads. Preview mode serves demo groups. Group lists are
   alphabetical, group feeds chronological — never ranked. */

type GroupRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_private: boolean;
  created_by: string;
  interests?: string[] | null;
};

// `interests` (0018) read defensively — fall back to the base columns if the
// column isn't there yet, so /groups never breaks pre-migration.
const GROUP_COLS_WITH =
  "id, name, slug, description, is_private, created_by, interests";
const GROUP_COLS_BASE = "id, name, slug, description, is_private, created_by";

async function withCounts(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>,
  row: GroupRow,
): Promise<Group> {
  const [{ count: members }, { count: followers }] = await Promise.all([
    supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", row.id),
    supabase
      .from("group_followers")
      .select("*", { count: "exact", head: true })
      .eq("group_id", row.id),
  ]);
  return {
    ...row,
    interests: row.interests ?? [],
    member_count: members ?? 0,
    follower_count: followers ?? 0,
  };
}

export async function getGroups(): Promise<Group[]> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return Object.values(DEMO_GROUPS).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }
  const first = await supabase.from("groups").select(GROUP_COLS_WITH).order("name");
  const data = first.error
    ? (await supabase.from("groups").select(GROUP_COLS_BASE).order("name")).data
    : first.data;
  return Promise.all(((data ?? []) as GroupRow[]).map((r) => withCounts(supabase, r)));
}

/** Groups the signed-in user follows (for the /following browse). */
export async function getFollowedGroups(): Promise<Group[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: rows } = await supabase
    .from("group_followers")
    .select("group_id")
    .eq("profile_id", user.id);
  const ids = (rows ?? []).map((r) => r.group_id);
  if (ids.length === 0) return [];
  const first = await supabase.from("groups").select(GROUP_COLS_WITH).in("id", ids);
  const data = first.error
    ? (await supabase.from("groups").select(GROUP_COLS_BASE).in("id", ids)).data
    : first.data;
  return Promise.all(((data ?? []) as GroupRow[]).map((r) => withCounts(supabase, r)));
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return DEMO_GROUPS[slug] ?? null;
  const first = await supabase
    .from("groups")
    .select(GROUP_COLS_WITH)
    .eq("slug", slug)
    .maybeSingle();
  const data = first.error
    ? (
        await supabase
          .from("groups")
          .select(GROUP_COLS_BASE)
          .eq("slug", slug)
          .maybeSingle()
      ).data
    : first.data;
  return data ? withCounts(supabase, data as GroupRow) : null;
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    const slug = Object.values(DEMO_GROUPS).find((g) => g.id === groupId)?.slug;
    return slug ? (DEMO_GROUP_MEMBERS[slug] ?? []) : [];
  }
  const { data } = await supabase
    .from("group_members")
    .select("profile_id, role, profile:profiles(handle, display_name)")
    .eq("group_id", groupId);
  return ((data ?? []) as unknown as {
    profile_id: string;
    role: "owner" | "member";
    profile: { handle: string | null; display_name: string | null } | null;
  }[]).map((m) => ({
    profile_id: m.profile_id,
    role: m.role,
    handle: m.profile?.handle ?? "",
    display_name: m.profile?.display_name ?? m.profile?.handle ?? "Unnamed",
  }));
}

/**
 * The groups the viewer already follows / belongs to — one pair of queries,
 * used to decide which cards on the groups list show a "Follow" action.
 */
export async function getViewerGroupSets(): Promise<{
  followed: string[];
  member: string[];
}> {
  const supabase = await createServerSupabase();
  if (!supabase) return { followed: [], member: [] };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { followed: [], member: [] };

  const [{ data: f }, { data: m }] = await Promise.all([
    supabase.from("group_followers").select("group_id").eq("profile_id", user.id),
    supabase.from("group_members").select("group_id").eq("profile_id", user.id),
  ]);
  return {
    followed: (f ?? []).map((r) => r.group_id),
    member: (m ?? []).map((r) => r.group_id),
  };
}

/** The viewer's relation to a group. Preview mode: always "none". */
export async function getViewerGroupRelation(
  groupId: string,
): Promise<GroupRelation> {
  const supabase = await createServerSupabase();
  if (!supabase) return "none";
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "none";

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (membership) return membership.role === "owner" ? "owner" : "member";

  const [{ data: invite }, { data: request }, { data: follow }] =
    await Promise.all([
      supabase
        .from("group_invites")
        .select("group_id")
        .eq("group_id", groupId)
        .eq("invitee_id", user.id)
        .maybeSingle(),
      supabase
        .from("group_join_requests")
        .select("group_id")
        .eq("group_id", groupId)
        .eq("requester_id", user.id)
        .maybeSingle(),
      supabase
        .from("group_followers")
        .select("group_id")
        .eq("group_id", groupId)
        .eq("profile_id", user.id)
        .maybeSingle(),
    ]);
  if (invite) return "invited";
  if (request) return "requested";
  if (follow) return "follower";
  return "none";
}

/** Posts tagged into a group, chronological. Reuses the posts demo/mapper. */
export async function getGroupPosts(
  group: Group,
  limit = 30,
): Promise<Post[]> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    const ids = DEMO_GROUP_POSTS[group.slug] ?? [];
    return DEMO_POSTS.filter((p) => ids.includes(p.id))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
  const { data: tagRows } = await supabase
    .from("post_groups")
    .select("post_id")
    .eq("group_id", group.id)
    .limit(200);
  const ids = (tagRows ?? []).map((r) => r.post_id);
  if (ids.length === 0) return [];

  const { getPostsByIds } = await import("@/lib/posts/queries");
  return getPostsByIds(ids, limit);
}

/** Batch post→groups map for feed markers — one query, no N+1. */
export async function getGroupsForPosts(
  postIds: string[],
): Promise<Map<string, GroupTag[]>> {
  const map = new Map<string, GroupTag[]>();
  if (postIds.length === 0) return map;

  const supabase = await createServerSupabase();
  if (!supabase) {
    for (const id of postIds) {
      const tags = DEMO_POST_GROUPS[id];
      if (tags) map.set(id, tags);
    }
    return map;
  }

  const { data } = await supabase
    .from("post_groups")
    .select("post_id, group:groups(slug, name)")
    .in("post_id", postIds);
  for (const row of (data ?? []) as unknown as {
    post_id: string;
    group: { slug: string; name: string } | null;
  }[]) {
    if (!row.group) continue;
    const tags = map.get(row.post_id) ?? [];
    tags.push({ slug: row.group.slug, name: row.group.name });
    map.set(row.post_id, tags);
  }
  return map;
}

export interface TaggableGroup extends GroupTag {
  id: string;
}

/** Groups the signed-in user is a MEMBER of (taggable at publish time). */
export async function getOwnMemberGroups(): Promise<TaggableGroup[]> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    // Preview: "you" is a member of Analogue Circle.
    const g = DEMO_GROUPS["analogue-circle"];
    return [{ id: g.id, slug: g.slug, name: g.name }];
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("group_members")
    .select("group:groups(id, slug, name)")
    .eq("profile_id", user.id);
  return ((data ?? []) as unknown as {
    group: { id: string; slug: string; name: string } | null;
  }[])
    .filter((r) => r.group)
    .map((r) => ({ id: r.group!.id, slug: r.group!.slug, name: r.group!.name }));
}
