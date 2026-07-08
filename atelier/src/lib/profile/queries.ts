import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_PROFILES, DEMO_SELF } from "./demo";
import { parseLayout } from "./layout";
import { parseLinks, type PublicProfile } from "./types";

/* Server-side profile reads. Preview mode (no Supabase) serves demo data. */

type ProfileRow = {
  id: string;
  handle: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  links: unknown;
  layout: unknown;
};

function toPublicProfile(row: ProfileRow, followerCount: number): PublicProfile {
  return {
    id: row.id,
    handle: row.handle ?? "",
    display_name: row.display_name ?? row.handle ?? "Unnamed",
    bio: row.bio ?? "",
    avatar_url: row.avatar_url,
    links: parseLinks(row.links),
    layout: parseLayout(row.layout),
    follower_count: followerCount,
  };
}

export async function getProfileByHandle(
  handle: string,
): Promise<PublicProfile | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return DEMO_PROFILES[handle] ?? null;

  const { data } = await supabase
    .from("profiles")
    .select("id, handle, display_name, bio, avatar_url, links, layout")
    .eq("handle", handle)
    .maybeSingle();
  if (!data) return null;

  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("followee_id", data.id);

  return toPublicProfile(data, count ?? 0);
}

export async function getOwnProfile(): Promise<PublicProfile | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return DEMO_SELF;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, handle, display_name, bio, avatar_url, links, layout")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;

  return toPublicProfile(data, 0);
}

/** Whether the signed-in viewer follows `targetId`. Preview mode: false. */
export async function isFollowing(targetId: string): Promise<boolean> {
  const supabase = await createServerSupabase();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("followee_id", targetId)
    .maybeSingle();
  return Boolean(data);
}

export async function getViewerId(): Promise<string | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
