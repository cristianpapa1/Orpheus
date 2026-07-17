import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

/**
 * The viewer's favorites for a set of posts, with an optimistic toggle.
 * Mirrors the web's `post_favorites(post_id, profile_id)` model + RLS (a user
 * favorites/unfavorites as themselves). Reloads when the post set changes.
 */
export function useFavorites(postIds: string[]) {
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [uid, setUid] = useState<string | null>(null);
  const key = postIds.join(",");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUid(user?.id ?? null);
      if (!user || postIds.length === 0) return;
      const { data } = await supabase
        .from("post_favorites")
        .select("post_id")
        .eq("profile_id", user.id)
        .in("post_id", postIds);
      if (!cancelled) setFavSet(new Set((data ?? []).map((r) => r.post_id as string)));
    })();
    return () => {
      cancelled = true;
    };
    // `key` encodes the post set — depending on the array itself would re-run
    // every render; the joined string only changes when the ids change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const toggle = useCallback(
    async (postId: string) => {
      if (!uid) return;
      const has = favSet.has(postId);
      setFavSet((prev) => {
        const next = new Set(prev);
        if (has) next.delete(postId);
        else next.add(postId);
        return next;
      });
      if (has) {
        await supabase
          .from("post_favorites")
          .delete()
          .eq("post_id", postId)
          .eq("profile_id", uid);
      } else {
        await supabase.from("post_favorites").insert({ post_id: postId, profile_id: uid });
      }
    },
    [uid, favSet],
  );

  return { favSet, toggle };
}
