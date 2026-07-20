/**
 * Event participation — the shared domain for RSVP → organizer confirmation →
 * block, and the single rule that gates who may post a Hero tied to an event.
 *
 * Kept pure and app-agnostic ON PURPOSE. Atelier owns event *creation* today,
 * but this same state machine is meant to back an Astelier "Events" tab
 * (managing events + attendee confirmation + ticketing) tomorrow — exactly as
 * `commerce/*` backs Astelier stores. Both apps read the same public tables
 * (`event_participants`) and must agree on what "confirmed" means, so the rule
 * lives here once. This mirrors the SQL `is_event_confirmed()` (migration 0034)
 * so a client can gate the UI before the server + RLS enforce it for real.
 */

/** How the organizer sees one attendee. A block wins over a confirmation. */
export type AttendeeStatus = "going" | "confirmed" | "blocked";

export interface Participant {
  profile_id: string;
  /** ISO timestamp the organizer confirmed the attendee, or null. */
  confirmed_at: string | null;
  /** ISO timestamp the organizer blocked the attendee from the event, or null. */
  blocked_at: string | null;
}

type Flags = Pick<Participant, "confirmed_at" | "blocked_at">;

/** Derive the effective status from the raw row flags. Block always wins. */
export function attendeeStatus(p: Flags): AttendeeStatus {
  if (p.blocked_at) return "blocked";
  if (p.confirmed_at) return "confirmed";
  return "going";
}

/**
 * May this viewer post a Hero tied to this event? True for the event owner, or
 * for a confirmed-and-not-blocked attendee. This is the client-side twin of the
 * DB gate — never the only line of defence (the server action re-checks and RLS
 * enforces), just what lets the composer refuse early with a clear message.
 */
export function canPostEventHero(opts: {
  isOwner: boolean;
  participant?: Flags | null;
}): boolean {
  if (opts.isOwner) return true;
  const p = opts.participant;
  return Boolean(p && p.confirmed_at && !p.blocked_at);
}

/** Split a participant list into the organizer's working buckets. */
export function bucketAttendees<T extends Flags>(
  participants: T[],
): { confirmed: T[]; going: T[]; blocked: T[] } {
  const confirmed: T[] = [];
  const going: T[] = [];
  const blocked: T[] = [];
  for (const p of participants) {
    const s = attendeeStatus(p);
    if (s === "blocked") blocked.push(p);
    else if (s === "confirmed") confirmed.push(p);
    else going.push(p);
  }
  return { confirmed, going, blocked };
}

export const ATTENDEE_STATUS_LABEL: Record<AttendeeStatus, string> = {
  going: "Going",
  confirmed: "Confirmed",
  blocked: "Blocked",
};
