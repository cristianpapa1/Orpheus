"use client";

import { useState } from "react";
import Link from "next/link";
import { attendeeStatus } from "@atelier/core/events/participation";
import { blockAttendee, confirmAttendee } from "@/app/(shell)/events/actions";
import type { EventAttendee } from "@/lib/events/queries";

/**
 * Organizer-only attendee list. RSVPs are public; this adds the two organizer
 * powers on top: CONFIRM (vouch someone actually came — unlocks their Hero
 * posting for this event) and BLOCK (bar someone from tying Heroes to the
 * event). Optimistic; the server action + RLS are the real authority.
 */
export function EventAttendeePanel({
  eventId,
  initial,
}: {
  eventId: string;
  initial: EventAttendee[];
}) {
  const [attendees, setAttendees] = useState<EventAttendee[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);

  const patch = (profileId: string, changes: Partial<EventAttendee>) =>
    setAttendees((as) =>
      as.map((a) => (a.profile_id === profileId ? { ...a, ...changes } : a)),
    );

  const doConfirm = async (a: EventAttendee, confirm: boolean) => {
    setBusy(a.profile_id);
    const prev = a.confirmed_at;
    patch(a.profile_id, { confirmed_at: confirm ? new Date().toISOString() : null });
    const r = await confirmAttendee(eventId, a.profile_id, confirm);
    if (!r.ok) patch(a.profile_id, { confirmed_at: prev });
    setBusy(null);
  };

  const doBlock = async (a: EventAttendee, block: boolean) => {
    setBusy(a.profile_id);
    const prev = a.blocked_at;
    patch(a.profile_id, { blocked_at: block ? new Date().toISOString() : null });
    const r = await blockAttendee(eventId, a.profile_id, block);
    if (!r.ok) patch(a.profile_id, { blocked_at: prev });
    setBusy(null);
  };

  if (attendees.length === 0) {
    return <p className="text-body opacity-70">No one has RSVP&apos;d yet.</p>;
  }

  return (
    <ul data-attendees className="flex flex-col gap-2">
      {attendees.map((a) => {
        const status = attendeeStatus(a);
        const isBusy = busy === a.profile_id;
        return (
          <li
            key={a.profile_id}
            data-attendee={a.profile_id}
            className="flex flex-wrap items-center justify-between gap-2 border-2 border-ink px-3 py-2"
          >
            <Link
              href={`/u/${a.handle || a.profile_id}`}
              className="min-w-0 truncate text-caption font-bold uppercase hover:text-blue"
            >
              {a.display_name}
              {a.handle ? ` · @${a.handle}` : ""}
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <span
                data-attendee-status={status}
                className={`text-caption font-bold uppercase ${
                  status === "confirmed"
                    ? "text-blue"
                    : status === "blocked"
                      ? "text-red"
                      : "opacity-60"
                }`}
              >
                {status === "confirmed" ? "✓ Confirmed" : status === "blocked" ? "⦸ Blocked" : "Going"}
              </span>
              {status !== "blocked" ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => doConfirm(a, !a.confirmed_at)}
                  data-confirm={a.profile_id}
                  className="border-2 border-ink px-2 py-0.5 text-caption font-bold uppercase hover:bg-blue hover:text-paper disabled:opacity-50"
                >
                  {a.confirmed_at ? "Unconfirm" : "Confirm"}
                </button>
              ) : null}
              <button
                type="button"
                disabled={isBusy}
                onClick={() => doBlock(a, !a.blocked_at)}
                data-block={a.profile_id}
                className="border-2 border-ink px-2 py-0.5 text-caption font-bold uppercase hover:bg-red hover:text-paper disabled:opacity-50"
              >
                {a.blocked_at ? "Unblock" : "Block"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
