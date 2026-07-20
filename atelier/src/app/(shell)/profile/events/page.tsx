import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { CreatorGate } from "@/components/creator/CreatorGate";
import { getOwnEvents } from "@/lib/events/queries";
import { getViewerCreatorStatus } from "@/lib/profile/queries";
import { formatEventDate, splitEvents } from "@atelier/core/events/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createEvent, deleteEvent } from "./actions";

export const metadata = { title: "Your events — Atelier" };

const ERRORS: Record<string, string> = {
  unavailable: "Preview mode — managing events needs Supabase configured.",
  locked: "Announcing events is for approved creators.",
  title: "Titles are 3–80 characters.",
  date: "Pick a valid date and time.",
  url: "Ticket links must start with http(s)://",
  create: "Couldn't save the event. Try again.",
};

export default async function ProfileEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const { error, created } = await searchParams;
  const configured = isSupabaseConfigured();
  const creatorStatus = await getViewerCreatorStatus();
  const canPost = creatorStatus === "approved";
  const events = await getOwnEvents();
  const { upcoming, past } = splitEvents(events, new Date().toISOString());

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold uppercase">Your events</h1>
      <WindowGrid>
        <Window title="Add an event" accent="red" span="col-span-12 md:col-span-5">
          {error ? (
            <p role="alert" className="mb-3 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
              {ERRORS[error] ?? "Something went wrong."}
            </p>
          ) : null}
          {created ? (
            <p role="status" className="mb-3 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
              Event added — it&apos;s live on your profile.
            </p>
          ) : null}
          {!configured ? (
            <p data-setup-notice className="mb-3 border-2 border-ink bg-yellow px-3 py-2 text-caption font-bold uppercase">
              Preview mode — the demo events below show how it works
            </p>
          ) : null}
          {configured && !canPost ? (
            <CreatorGate status={creatorStatus} />
          ) : (
          <>
          <form action={createEvent} data-create-event className="flex flex-col gap-3">
            <label htmlFor="title" className="text-caption font-bold uppercase">Title</label>
            <input id="title" name="title" required minLength={3} maxLength={80} disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50" />

            <label htmlFor="starts_at" className="text-caption font-bold uppercase">Date & time</label>
            <input id="starts_at" name="starts_at" type="datetime-local" required disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50" />

            <label htmlFor="location_type" className="text-caption font-bold uppercase">Where</label>
            <select id="location_type" name="location_type" disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50">
              <option value="venue">Physical venue</option>
              <option value="online">Online</option>
            </select>
            <input aria-label="Location" name="location" maxLength={120} placeholder="Venue / link context" disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50" />

            <label htmlFor="description" className="text-caption font-bold uppercase">Description</label>
            <textarea id="description" name="description" rows={3} maxLength={600} disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50" />

            <label htmlFor="ticket_url" className="text-caption font-bold uppercase">Ticket / buy link</label>
            <input id="ticket_url" name="ticket_url" type="url" placeholder="https://…" disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50" />

            <button type="submit" disabled={!configured}
              className="self-start border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50">
              Add event
            </button>
          </form>
          <p className="mt-4 text-caption uppercase opacity-70">
            Tickets are sold wherever you sell them — Atelier only links out
          </p>
          </>
          )}
        </Window>

        <Window title="Upcoming" accent="blue" span="col-span-12 md:col-span-7">
          {upcoming.length === 0 ? (
            <p className="text-body opacity-70">No upcoming events.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {upcoming.map((e) => (
                <li key={e.id} data-own-event={e.id} className="border-2 border-ink p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/e/${e.id}`} data-open-event={e.id} className="text-h2 font-bold hover:text-blue">
                      {e.title}
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link href={`/e/${e.id}`} aria-label={`Open ${e.title}`}
                        className="border-2 border-ink px-2 py-0.5 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper">
                        Open →
                      </Link>
                      <form action={deleteEvent}>
                        <input type="hidden" name="id" value={e.id} />
                        <button disabled={!configured} aria-label={`Delete ${e.title}`}
                          className="border-2 border-ink px-2 py-0.5 text-caption font-bold uppercase hover:bg-red hover:border-red hover:text-paper disabled:opacity-50">
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                  <p className="mt-1 text-caption uppercase opacity-70">
                    Open to confirm attendees, manage Heroes, and see who&apos;s going.
                  </p>
                  <p className="mt-1 text-caption font-bold uppercase">
                    {formatEventDate(e.starts_at)} · {e.location_type === "online" ? "Online" : e.location}
                  </p>
                  {e.description ? <p className="mt-2 text-body">{e.description}</p> : null}
                </li>
              ))}
            </ul>
          )}
          {past.length > 0 ? (
            <details className="mt-6">
              <summary className="cursor-pointer text-caption font-bold uppercase">
                Past events ({past.length})
              </summary>
              <ul className="mt-3 flex flex-col gap-2 opacity-70">
                {past.map((e) => (
                  <li key={e.id} className="flex items-baseline justify-between gap-3">
                    <Link href={`/e/${e.id}`} className="text-body hover:text-blue">{e.title}</Link>
                    <span className="text-caption uppercase">{formatEventDate(e.starts_at)}</span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </Window>
      </WindowGrid>
    </div>
  );
}
