import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getUpcomingEvents } from "@/lib/events/queries";
import { formatEventDate, groupEventsByMonth } from "@atelier/core/events/types";

export const metadata = { title: "Events — Atelier" };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const events = await getUpcomingEvents(new Date().toISOString(), mode);
  const groups = groupEventsByMonth(events);

  return (
    <div>
      <h1 className="mb-2 text-h1 font-bold uppercase">Events</h1>
      <p className="mb-6 max-w-2xl text-body">
        Openings, shows, firings, screenings — everything the makers here have
        coming up, in date order. Nothing promoted.
      </p>

      <form data-event-filters method="get" className="mb-6 flex items-end gap-3">
        <label className="flex flex-col gap-1 text-caption font-bold uppercase">
          Where
          <select name="mode" defaultValue={mode ?? ""}
            className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue">
            <option value="">Anywhere</option>
            <option value="venue">In person</option>
            <option value="online">Online</option>
          </select>
        </label>
        <button type="submit"
          className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
          Filter
        </button>
      </form>

      {groups.length === 0 ? (
        <WindowGrid>
          <Window title="Quiet" accent="yellow" span="col-span-12 md:col-span-6">
            <p className="text-body">Nothing upcoming matches. Check back — or announce your own from your profile.</p>
          </Window>
        </WindowGrid>
      ) : (
        groups.map((group, gi) => (
          <section key={group.label} data-month={group.label} className="mb-8">
            <h2 className="mb-4 text-h2 font-bold uppercase">{group.label}</h2>
            <WindowGrid>
              {group.events.map((e, i) => (
                <div key={e.id} data-global-event={e.id} className="col-span-12 flex flex-col md:col-span-6">
                  <Window
                    title={e.location_type === "online" ? "Online" : "In person"}
                    accent={(["red", "blue", "yellow"] as const)[(gi + i) % 3]}
                    className="h-full"
                  >
                    <p className="text-h2 font-bold">{e.title}</p>
                    <p className="mt-1 text-caption font-bold uppercase">
                      {formatEventDate(e.starts_at)}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                    {e.description ? <p className="mt-2 text-body">{e.description}</p> : null}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link href={`/u/${e.creator_handle}`} className="text-caption font-bold uppercase hover:text-blue">
                        {e.creator_name} · @{e.creator_handle}
                      </Link>
                      {e.ticket_url ? (
                        <a
                          data-ticket-link
                          href={e.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-red hover:border-red"
                        >
                          Tickets ↗
                        </a>
                      ) : null}
                    </div>
                  </Window>
                </div>
              ))}
            </WindowGrid>
          </section>
        ))
      )}
    </div>
  );
}
