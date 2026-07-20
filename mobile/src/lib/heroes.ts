import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

/**
 * The viewer's Hero likes for a set of Heroes, with an optimistic toggle.
 * Mirrors the web's `hero_favorites(hero_id, profile_id)` model + RLS (a user
 * likes/unlikes as themselves). Reloads when the Hero set changes.
 */
export function useHeroFavorites(heroIds: string[]) {
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [uid, setUid] = useState<string | null>(null);
  const key = heroIds.join(",");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUid(user?.id ?? null);
      if (!user || heroIds.length === 0) return;
      const { data } = await supabase
        .from("hero_favorites")
        .select("hero_id")
        .eq("profile_id", user.id)
        .in("hero_id", heroIds);
      if (!cancelled) setFavSet(new Set((data ?? []).map((r) => r.hero_id as string)));
    })();
    return () => {
      cancelled = true;
    };
    // `key` encodes the Hero set — see useFavorites for why we depend on it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const toggle = useCallback(
    async (heroId: string) => {
      if (!uid) return;
      const has = favSet.has(heroId);
      setFavSet((prev) => {
        const next = new Set(prev);
        if (has) next.delete(heroId);
        else next.add(heroId);
        return next;
      });
      if (has) {
        await supabase.from("hero_favorites").delete().eq("hero_id", heroId).eq("profile_id", uid);
      } else {
        await supabase.from("hero_favorites").insert({ hero_id: heroId, profile_id: uid });
      }
    },
    [uid, favSet],
  );

  return { favSet, toggle };
}
