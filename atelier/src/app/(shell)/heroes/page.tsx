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

export default async function HeroesPage({
  searchParams,
}: {
  searchParams: Promise<{ following?: string }>;
}) {
  const { following: followingParam } = await searchParams;
  const scopeFollowing = followingParam === "1";

  const [viewerId, isAdmin, following] = await Promise.all([
    getViewerId(),
    isViewerAdmin(),
    getFollowingRanked(),
  ]);
  // "People you follow" reuses the followed list for the author scope.
  const heroes = await getLiveHeroes(
    40,
    scopeFollowing ? following.map((f) => f.id) : null,
  );

  return (
    <HeroesFeed
      heroes={heroes}
      viewerId={viewerId}
      isAdmin={isAdmin}
      following={following.map((f) => ({ id: f.id, handle: f.handle, display_name: f.display_name }))}
      scopeFollowing={scopeFollowing}
    />
  );
}
