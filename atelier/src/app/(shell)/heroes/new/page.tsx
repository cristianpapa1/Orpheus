import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { HeroComposer } from "@/components/heroes/HeroComposer";
import { Window } from "@/components/ui/Window";

export const metadata: Metadata = { title: "New Hero — Atelier" };

export default async function NewHeroPage() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/heroes");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Optional event linking — the poster's own events (a performer tying a Hero
  // to their show). Broader participation-based linking arrives with Phase 2.
  const { data: events } = await supabase
    .from("events")
    .select("id, title")
    .eq("profile_id", user.id)
    .order("starts_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-2xl">
      <Window title="New Hero" accent="red">
        <HeroComposer events={events ?? []} />
      </Window>
    </div>
  );
}
