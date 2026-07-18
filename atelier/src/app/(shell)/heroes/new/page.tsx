import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getEventById } from "@/lib/events/queries";
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

  // The poster's own events, plus (if arriving from an event page) that event —
  // so an attendee can post a Hero for a show they didn't organise.
  const { data: own } = await supabase
    .from("events")
    .select("id, title")
    .eq("profile_id", user.id)
    .order("starts_at", { ascending: false })
    .limit(50);
  const options: { id: string; title: string }[] = (own ?? []).map((e) => ({ id: e.id, title: e.title }));

  let initialEventId = "";
  if (eventParam && !options.some((o) => o.id === eventParam)) {
    const linked = await getEventById(eventParam);
    if (linked) {
      options.unshift({ id: linked.id, title: linked.title });
      initialEventId = linked.id;
    }
  } else if (eventParam) {
    initialEventId = eventParam;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Window title="New Hero" accent="red">
        <HeroComposer events={options} initialEventId={initialEventId} />
      </Window>
    </div>
  );
}
