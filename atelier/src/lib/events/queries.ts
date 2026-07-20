import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_PROFILES } from "@/lib/profile/demo";
import { DEMO_EVENTS } from "./demo";
import type { EventItem, EventLocationType, GlobalEvent } from "@atelier/core/events/types";
import { canPostEventHero } from "@atelier/core/events/participation";

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
    // Explicit FK: 0032's event_participants/event_views also link events↔profiles,
    // so a bare `profiles` embed became ambiguous (PGRST201). Pin the owner FK.
    .select(
      "id, profile_id, title, description, starts_at, location, location_type, ticket_url, creator:profiles!events_profile_id_fkey(handle, display_name)",
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

export interface EventDetail extends EventItem {
  creator_handle: string;
  creator_name: string;
  creator_avatar_url: string | null;
}

/** A single event with its owner, for the detail page. Null if it's gone. */
export async function getEventById(id: string): Promise<EventDetail | null> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    const demo = Object.values(DEMO_EVENTS).flat().find((e) => e.id === id);
    if (!demo) return null;
    const p = DEMO_PROFILES[demo.profile_id];
    return { ...demo, creator_handle: p?.handle ?? "", creator_name: p?.display_name ?? "Unnamed", creator_avatar_url: null };
  }
  const { data } = await supabase
    .from("events")
    .select(
      "id, profile_id, title, description, starts_at, location, location_type, ticket_url, creator:profiles!events_profile_id_fkey(handle, display_name, avatar_url)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as EventRow & {
    creator: { handle: string | null; display_name: string | null; avatar_url: string | null } | null;
  };
  return {
    ...toEvent(row),
    creator_handle: row.creator?.handle ?? "",
    creator_name: row.creator?.display_name ?? row.creator?.handle ?? "Unnamed",
    creator_avatar_url: row.creator?.avatar_url ?? null,
  };
}

export interface EventEngagement {
  participants: number;
  going: boolean;
  views: number;
  /** Viewer owns the event (or manages the institution running it). */
  isOwner: boolean;
  /** Viewer may post a Hero tied to this event (owner, or confirmed + not blocked). */
  canPostHero: boolean;
  /** Viewer is a confirmed attendee (distinct from just going). */
  confirmed: boolean;
  /** Organizer has blocked the viewer from tying Heroes to this event. */
  blocked: boolean;
}

/** Participant + view counts for one event, whether the viewer is going, and
 *  the viewer's confirmation/owner status (which gates posting a Hero).
 *  Defensive: zeros/false when the 0032/0034 tables aren't there yet. */
export async function getEventEngagement(eventId: string): Promise<EventEngagement> {
  const base = { participants: 0, going: false, views: 0, isOwner: false, canPostHero: false, confirmed: false, blocked: false };
  const supabase = await createServerSupabase();
  if (!supabase) return base;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [partRes, viewRes, mineRes, ownerRes] = await Promise.all([
    supabase.from("event_participants").select("*", { count: "exact", head: true }).eq("event_id", eventId),
    supabase.from("event_views").select("*", { count: "exact", head: true }).eq("event_id", eventId),
    user
      ? supabase
          .from("event_participants")
          .select("event_id, confirmed_at, blocked_at")
          .eq("event_id", eventId)
          .eq("profile_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    user
      ? supabase.rpc("is_event_owner", { uid: user.id, ev: eventId })
      : Promise.resolve({ data: false, error: null }),
  ]);

  // Deploy-safe: before 0034 the confirmed_at/blocked_at columns (and the rpc)
  // don't exist. Fall back to a bare RSVP read so "I'm going" still shows; the
  // confirm/owner layer simply stays dark until the migration is applied.
  let mine = (mineRes as { data: { confirmed_at: string | null; blocked_at: string | null } | null; error: unknown }).data ?? null;
  if (user && (mineRes as { error: unknown }).error) {
    const base = await supabase
      .from("event_participants")
      .select("event_id")
      .eq("event_id", eventId)
      .eq("profile_id", user.id)
      .maybeSingle();
    mine = base.data ? { confirmed_at: null, blocked_at: null } : null;
  }
  const isOwner = Boolean((ownerRes as { data: boolean | null }).data);
  return {
    participants: partRes.count ?? 0,
    views: viewRes.count ?? 0,
    going: Boolean(mine),
    isOwner,
    confirmed: Boolean(mine?.confirmed_at && !mine?.blocked_at),
    blocked: Boolean(mine?.blocked_at),
    canPostHero: canPostEventHero({ isOwner, participant: mine }),
  };
}

/** Participant counts for many events at once (for list "N going"). Defensive:
 *  empty map when 0032 is absent. */
export async function getParticipantCounts(eventIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (eventIds.length === 0) return map;
  const supabase = await createServerSupabase();
  if (!supabase) return map;
  const { data, error } = await supabase
    .from("event_participants")
    .select("event_id")
    .in("event_id", eventIds);
  if (error || !data) return map;
  for (const r of data) map.set(r.event_id, (map.get(r.event_id) ?? 0) + 1);
  return map;
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

export interface EventAttendee {
  profile_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  confirmed_at: string | null;
  blocked_at: string | null;
}

/**
 * Everyone who RSVP'd to an event, with each one's confirm/block state, for the
 * organizer's attendee panel. RLS lets anyone read participants, so the caller
 * must gate the panel on ownership (getEventEngagement().isOwner). Defensive:
 * [] before 0032/0034. The profile embed is pinned to the RSVP FK because
 * confirmed_by/blocked_by also link participants→profiles (PGRST201 otherwise).
 */
export async function getEventAttendees(eventId: string): Promise<EventAttendee[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("event_participants")
    .select(
      "profile_id, created_at, confirmed_at, blocked_at, profile:profiles!event_participants_profile_id_fkey(handle, display_name, avatar_url)",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as unknown as {
    profile_id: string;
    created_at: string;
    confirmed_at: string | null;
    blocked_at: string | null;
    profile: { handle: string | null; display_name: string | null; avatar_url: string | null } | null;
  }[]).map((r) => ({
    profile_id: r.profile_id,
    handle: r.profile?.handle ?? "",
    display_name: r.profile?.display_name ?? r.profile?.handle ?? "Unnamed",
    avatar_url: r.profile?.avatar_url ?? null,
    created_at: r.created_at,
    confirmed_at: r.confirmed_at ?? null,
    blocked_at: r.blocked_at ?? null,
  }));
}

export interface PostableEvent {
  id: string;
  title: string;
  starts_at: string;
}

/**
 * Events the signed-in viewer may post a Hero for: ones they own (their own
 * profile or an institution they manage) plus ones where they're a confirmed,
 * non-blocked attendee. Recent first. This is what the Hero composer offers —
 * if it's empty, the viewer cannot post a Hero yet. Defensive: [] pre-0034.
 */
export async function getPostableEventsForViewer(limit = 50): Promise<PostableEvent[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Profiles the viewer owns outright or manages (institutions).
  const ownerIds = new Set<string>([user.id]);
  const { data: managed } = await supabase
    .from("profiles")
    .select("id")
    .eq("managed_by", user.id);
  for (const m of managed ?? []) ownerIds.add(m.id);

  // Events the viewer is a confirmed (not blocked) attendee of.
  const { data: conf } = await supabase
    .from("event_participants")
    .select("event_id")
    .eq("profile_id", user.id)
    .not("confirmed_at", "is", null)
    .is("blocked_at", null);
  const confirmedEventIds = (conf ?? []).map((r) => r.event_id);

  const byId = new Map<string, PostableEvent>();

  const [ownedRes, confRes] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, starts_at")
      .in("profile_id", Array.from(ownerIds)),
    confirmedEventIds.length
      ? supabase.from("events").select("id, title, starts_at").in("id", confirmedEventIds)
      : Promise.resolve({ data: [] as { id: string; title: string; starts_at: string }[] }),
  ]);

  for (const e of [
    ...((ownedRes.data ?? []) as { id: string; title: string; starts_at: string }[]),
    ...((confRes.data ?? []) as { id: string; title: string; starts_at: string }[]),
  ]) {
    byId.set(e.id, { id: e.id, title: e.title, starts_at: e.starts_at });
  }

  return Array.from(byId.values())
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
    .slice(0, limit);
}
