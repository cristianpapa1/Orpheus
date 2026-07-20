"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteHero } from "@/app/(shell)/heroes/actions";
import type { HeroItem } from "@/lib/heroes/queries";

/**
 * The poster grid of Heroes tied to an event. If the viewer owns the event
 * (canRemove), each tile gets a ✕ to take a Hero down — the anti-abuse lever
 * for someone riding the event's name. RLS lets the event owner delete; this is
 * just the surface for it.
 */
export function EventHeroShelf({
  heroes: initial,
  canRemove,
}: {
  heroes: HeroItem[];
  canRemove: boolean;
}) {
  const [heroes, setHeroes] = useState<HeroItem[]>(initial);

  const remove = async (id: string) => {
    if (!window.confirm("Remove this Hero from your event?")) return;
    setHeroes((hs) => hs.filter((h) => h.id !== id));
    await deleteHero(id);
  };

  if (heroes.length === 0) return null;

  return (
    <div data-event-heroes className="grid grid-cols-3 gap-2">
      {heroes.map((h) => (
        <div key={h.id} className="relative">
          <Link
            href={`/heroes?h=${h.id}`}
            data-event-hero={h.id}
            className="relative block border-2 border-ink"
          >
            {h.poster_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={h.poster_url}
                alt={h.alt_text ?? h.caption ?? "Hero"}
                className="aspect-[3/4] w-full object-cover"
              />
            ) : (
              <div className="grid aspect-[3/4] w-full place-items-center bg-ink text-paper">▶</div>
            )}
          </Link>
          {canRemove ? (
            <button
              type="button"
              onClick={() => remove(h.id)}
              data-remove-hero={h.id}
              aria-label="Remove this Hero"
              className="absolute right-1 top-1 border-2 border-paper bg-ink/80 px-1.5 text-caption font-bold text-paper hover:bg-red"
            >
              ✕
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
