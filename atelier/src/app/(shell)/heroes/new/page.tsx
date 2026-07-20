import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPostableEventsForViewer } from "@/lib/events/queries";
import { HeroComposer } from "@/components/heroes/HeroComposer";
import { Window } from "@/components/ui/Window";

export const metadata: Metadata = { title: "New Hero — Atelier" };

export default async function NewHeroPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/heroes");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { event: eventParam } = await searchParams;

  // A Hero must belong to an event you're confirmed for (or one you organize).
  // These are the only events the composer can offer.
  const events = await getPostableEventsForViewer();

  if (events.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Window title="New Hero" accent="red">
          <p className="text-body">
            Heroes belong to events. To post one, you need to be a{" "}
            <strong>confirmed</strong> attendee of an event — RSVP with{" "}
            &ldquo;I&apos;m going&rdquo;, then the organizer confirms you (a ticket
            check). Once confirmed, come back and your event will be here.
          </p>
          <Link
            href="/events"
            className="mt-4 inline-block border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
          >
            Browse events →
          </Link>
        </Window>
      </div>
    );
  }

  // Preselect the arriving event only if the viewer may actually post to it.
  const initialEventId =
    eventParam && events.some((e) => e.id === eventParam) ? eventParam : "";

  return (
    <div className="mx-auto max-w-2xl">
      <Window title="New Hero" accent="red">
        <HeroComposer
          events={events.map((e) => ({ id: e.id, title: e.title }))}
          initialEventId={initialEventId}
        />
      </Window>
    </div>
  );
}
