export type EventLocationType = "venue" | "online";

export interface EventItem {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  starts_at: string; // ISO-8601
  location: string;
  location_type: EventLocationType;
  ticket_url: string | null;
}

/**
 * Split events around `now`: upcoming sorted soonest-first, past sorted
 * most-recent-first. Pure — `now` is injected so it's unit-testable and
 * the server render is deterministic.
 */
export function splitEvents(
  events: EventItem[],
  now: string,
): { upcoming: EventItem[]; past: EventItem[] } {
  const upcoming = events
    .filter((e) => e.starts_at >= now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = events
    .filter((e) => e.starts_at < now)
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  return { upcoming, past };
}

export interface GlobalEvent extends EventItem {
  creator_handle: string;
  creator_name: string;
}

/** Group upcoming events by "Month Year" label, preserving ascending order. */
export function groupEventsByMonth<T extends EventItem>(
  events: T[],
): { label: string; events: T[] }[] {
  const groups: { label: string; events: T[] }[] = [];
  for (const event of events) {
    const d = new Date(event.starts_at);
    if (Number.isNaN(d.getTime())) continue;
    const label = new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
    const last = groups.at(-1);
    if (last && last.label === label) last.events.push(event);
    else groups.push({ label, events: [event] });
  }
  return groups;
}

/** Fixed-locale date + time — identical on server and client (UTC-labeled). */
export function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(d)} UTC`;
}
