import type { Metadata } from "next";
import { getLiveHeroes } from "@/lib/heroes/queries";
import { getFollowingRanked, getViewerId } from "@/lib/profile/queries";
import { isViewerAdmin } from "@/lib/donations/queries";
import { HeroesFeed } from "@/components/heroes/HeroesFeed";

export const metadata: Metadata = {
  title: "Heroes — Atelier",
  description: "Short vertical films from the community. Just for one day.",
};

// Ephemeral surface — never cache the list; live/expired changes by the minute.
export const dynamic = "force-dynamic";

export default async function HeroesPage() {
  const [heroes, viewerId, isAdmin, following] = await Promise.all([
    getLiveHeroes(),
    getViewerId(),
    isViewerAdmin(),
    getFollowingRanked(),
  ]);
  return (
    <HeroesFeed
      heroes={heroes}
      viewerId={viewerId}
      isAdmin={isAdmin}
      following={following.map((f) => ({ id: f.id, handle: f.handle, display_name: f.display_name }))}
    />
  );
}
