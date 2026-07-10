import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_EVENTS } from "./demo";
import type { EventItem, EventLocationType } from "./types";

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
