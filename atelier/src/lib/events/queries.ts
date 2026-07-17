import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_PROFILES } from "@/lib/profile/demo";
import { DEMO_EVENTS } from "./demo";
import type { EventItem, EventLocationType, GlobalEvent } from "@atelier/core/events/types";

type EventRow = {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  starts_at: string;
  location: string;
  location_type: string;
  ticket_url: string | null;
};

function toEvent(row: EventRow): EventItem {
  return {
    ...row,
    location_type: (row.location_type === "online"
      ? "online"
      : "venue") as EventLocationType,
  };
}

export async function getEventsByProfile(
  profileId: string,
): Promise<EventItem[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return DEMO_EVENTS[profileId] ?? [];

  const { data } = await supabase
    .from("events")
    .select(
      "id, profile_id, title, description, starts_at, location, location_type, ticket_url",
    )
    .eq("profile_id", profileId)
    .order("starts_at");
  return ((data ?? []) as EventRow[]).map(toEvent);
}

/** Track C: every upcoming event on the platform, soonest first. */
export async function getUpcomingEvents(
  now: string,
  mode?: string,
  limit = 100,
  /** When provided, only events by these creators (e.g. profiles you follow). */
  creatorIds?: string[] | null,
): Promise<GlobalEvent[]> {
  // A scoped request with an empty set (you follow nobody) has no results.
  if (creatorIds && creatorIds.length === 0) return [];
  const supabase = await createServerSupabase();
  if (!supabase) {
    const profiles = Object.values(DEMO_PROFILES);
    return Object.values(DEMO_EVENTS)
      .flat()
      .filter((e) => e.starts_at >= now)
      .filter((e) => !mode || e.location_type === mode)
      .filter((e) => !creatorIds || creatorIds.includes(e.profile_id))
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      .slice(0, limit)
      .map((e) => {
        const p = profiles.find((pr) => pr.id === e.profile_id);
        return {
          ...e,
          creator_handle: p?.handle ?? "",
          creator_name: p?.display_name ?? "Unnamed",
        };
      });
  }

  let query = supabase
    .from("events")
    .select(
      "id, profile_id, title, description, starts_at, location, location_type, ticket_url, creator:profiles(handle, display_name)",
    )
    .gte("starts_at", now)
    .order("starts_at")
    .limit(limit);
  if (mode === "venue" || mode === "online") {
    query = query.eq("location_type", mode);
  }
  if (creatorIds) query = query.in("profile_id", creatorIds);
  const { data } = await query;
  return ((data ?? []) as unknown as (EventRow & {
    creator: { handle: string | null; display_name: string | null } | null;
  })[]).map((row) => ({
    ...toEvent(row),
    creator_handle: row.creator?.handle ?? "",
    creator_name: row.creator?.display_name ?? row.creator?.handle ?? "Unnamed",
  }));
}

export async function getOwnEvents(): Promise<EventItem[]> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    // Preview: show Inês's demo events so the manager is explorable.
    return DEMO_EVENTS["00000000-0000-4000-a000-000000000001"] ?? [];
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return getEventsByProfile(user.id);
}
