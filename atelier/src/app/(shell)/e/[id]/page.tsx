import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getEventAttendees, getEventById, getEventEngagement } from "@/lib/events/queries";
import { getHeroesForEvent } from "@/lib/heroes/queries";
import { getViewerId } from "@/lib/profile/queries";
import { getI18n } from "@/lib/i18n/server";
import { formatEventDate } from "@atelier/core/events/types";
import { JoinButton } from "@/components/events/JoinButton";
import { EventViewRecorder } from "@/components/events/EventViewRecorder";
import { EventAttendeePanel } from "@/components/events/EventAttendeePanel";
import { EventHeroShelf } from "@/components/events/EventHeroShelf";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ev = await getEventById(id);
  return { title: ev ? `${ev.title} — Atelier` : "Event — Atelier" };
}

// Engagement changes by the minute; never cache.
export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const [engagement, heroes, viewerId, { t: dict }] = await Promise.all([
    getEventEngagement(id),
    getHeroesForEvent(id),
    getViewerId(),
    getI18n(),
  ]);
  const t = dict.events;
  // Only the organizer sees (and needs) the attendee list.
  const attendees = engagement.isOwner ? await getEventAttendees(id) : [];

  // Viewer status line under the RSVP (new copy — hardcoded EN, i18n follow-up).
  let statusLine: string | null = null;
  if (engagement.isOwner) statusLine = "You organize this event.";
  else if (engagement.blocked) statusLine = "You can't post Heroes for this event.";
  else if (engagement.confirmed) statusLine = "✓ You're confirmed — you can post a Hero from this event.";
  else if (engagement.going) statusLine = "You're going — waiting for the organizer to confirm you.";

  return (
    <>
      <EventViewRecorder eventId={id} />
      <WindowGrid>
        <div className="col-span-12 flex flex-col md:col-span-7">
          <Window
            title={event.location_type === "online" ? t.online : t.inPerson}
            accent="red"
            className="h-full"
          >
            <p className="text-h1 font-bold">{event.title}</p>
            <p className="mt-1 text-caption font-bold uppercase">
              {formatEventDate(event.starts_at)}
              {event.location ? ` · ${event.location}` : ""}
            </p>
            {event.description ? <p className="mt-3 text-body">{event.description}</p> : null}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={`/u/${event.creator_handle || event.profile_id}`}
                className="text-caption font-bold uppercase hover:text-blue"
              >
                {event.creator_name}
                {event.creator_handle ? ` · @${event.creator_handle}` : ""}
              </Link>
              {event.ticket_url ? (
                <a
                  data-ticket-link
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-red hover:border-red"
                >
                  {t.tickets}
                </a>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 border-t-2 border-ink pt-4">
              <JoinButton
                eventId={id}
                initialGoing={engagement.going}
                initialCount={engagement.participants}
                canJoin={!!viewerId}
              />
              <span data-event-views className="text-caption font-bold uppercase opacity-70">
                👁 {engagement.views} {t.views}
              </span>
            </div>
            {statusLine ? (
              <p data-viewer-status className="mt-3 text-caption font-bold uppercase opacity-80">
                {statusLine}
              </p>
            ) : null}
          </Window>
        </div>

        <div className="col-span-12 flex flex-col md:col-span-5">
          <Window title={t.heroesHere} accent="blue" className="h-full">
            <p className="mb-3 text-caption uppercase opacity-70">{t.heroesHereHint}</p>
            {heroes.length === 0 ? (
              <p className="text-body opacity-70">{t.heroesEmpty}</p>
            ) : (
              <EventHeroShelf heroes={heroes} canRemove={engagement.isOwner} />
            )}
            {engagement.canPostHero ? (
              <Link
                href={`/heroes/new?event=${id}`}
                data-post-hero
                className="mt-4 inline-block border-2 border-ink bg-ink px-4 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
              >
                ＋ {t.postHero}
              </Link>
            ) : (
              <p className="mt-4 text-caption uppercase opacity-70">
                Only confirmed attendees can post a Hero from this event.
              </p>
            )}
          </Window>
        </div>

        {engagement.isOwner ? (
          <div className="col-span-12">
            <Window title="Attendees" accent="yellow">
              <p className="mb-3 text-caption uppercase opacity-70">
                Confirm who actually attended (your ticket check). Confirmed attendees can post a Hero
                from this event. Block anyone abusing the event&apos;s name.
              </p>
              <EventAttendeePanel eventId={id} initial={attendees} />
            </Window>
          </div>
        ) : null}
      </WindowGrid>
    </>
  );
}
