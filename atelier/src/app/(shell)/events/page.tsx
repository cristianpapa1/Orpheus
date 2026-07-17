import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getUpcomingEvents } from "@/lib/events/queries";
import { getFollowing } from "@/lib/profile/queries";
import { formatEventDate, groupEventsByMonth } from "@atelier/core/events/types";
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Events — Atelier" };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; following?: string }>;
}) {
  const { mode, following: followingParam } = await searchParams;
  const following = followingParam === "1";
  const follows = following ? await getFollowing() : [];
  const events = await getUpcomingEvents(
    new Date().toISOString(),
    mode,
    100,
    following ? follows.map((f) => f.id) : null,
  );
  const groups = groupEventsByMonth(events);
  const { t: dict } = await getI18n();
  const t = dict.events;

  const scopeHref = (f: boolean) => {
    const p = new URLSearchParams();
    if (f) p.set("following", "1");
    if (mode) p.set("mode", mode);
    const s = p.toString();
    return s ? `/events?${s}` : "/events";
  };

  return (
    <div>
      <h1 className="mb-2 text-h1 font-bold uppercase">{t.title}</h1>
      <p className="mb-4 max-w-2xl text-body">
        {following ? t.introFollowing : t.introAll}
      </p>

      <div data-scope-toggle className="mb-6 flex flex-wrap gap-2">
        <Link href={scopeHref(true)} aria-current={following}
          className={`border-2 border-ink px-4 py-2 text-caption font-bold uppercase ${following ? "bg-ink text-paper" : "hover:bg-yellow"}`}>
          {t.peopleYouFollow}
        </Link>
        <Link href={scopeHref(false)} aria-current={!following}
          className={`border-2 border-ink px-4 py-2 text-caption font-bold uppercase ${!following ? "bg-ink text-paper" : "hover:bg-yellow"}`}>
          {t.everyone}
        </Link>
      </div>

      <form data-event-filters method="get" className="mb-6 flex items-end gap-3">
        {following ? <input type="hidden" name="following" value="1" /> : null}
        <label className="flex flex-col gap-1 text-caption font-bold uppercase">
          {t.where}
          <select name="mode" defaultValue={mode ?? ""}
            className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue">
            <option value="">{t.anywhere}</option>
            <option value="venue">{t.inPerson}</option>
            <option value="online">{t.online}</option>
          </select>
        </label>
        <button type="submit"
          className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
          {t.filter}
        </button>
      </form>

      {groups.length === 0 ? (
        <WindowGrid>
          <Window title={t.quiet} accent="yellow" span="col-span-12 md:col-span-6">
            <p className="text-body">
              {following
                ? follows.length === 0
                  ? t.quietFollowingNone
                  : t.quietFollowingSome
                : t.quietAll}
            </p>
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
                    title={e.location_type === "online" ? t.online : t.inPerson}
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
                          {t.tickets}
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
