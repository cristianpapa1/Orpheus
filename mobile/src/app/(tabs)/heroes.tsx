import { heroCountdown } from "@atelier/core/heroes/types";
import { useVideoPlayer, VideoView } from "expo-video";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { mediaUrl, supabase } from "../../lib/supabase";
import { useHeroFavorites } from "../../lib/heroes";
import { BAUHAUS, FONT, FONT_BODY } from "../../theme";

const { height: SCREEN_H } = Dimensions.get("window");

interface HeroRow {
  id: string;
  media_path: string;
  poster_path: string | null;
  caption: string;
  expires_at: string;
  author_id: string;
  event_id: string | null;
  author: { handle: string | null; display_name: string | null } | null;
  event: { title: string | null } | null;
}

interface Hero {
  id: string;
  media_url: string;
  poster_url: string | null;
  caption: string;
  expires_at: string;
  author_handle: string;
  author_name: string;
  event_id: string | null;
  event_title: string | null;
}

const toHero = (r: HeroRow): Hero => ({
  id: r.id,
  media_url: mediaUrl(r.media_path),
  poster_url: r.poster_path ? mediaUrl(r.poster_path) : null,
  caption: r.caption,
  expires_at: r.expires_at,
  author_handle: r.author?.handle ?? "",
  author_name: r.author?.display_name ?? r.author?.handle ?? "Unnamed",
  event_id: r.event_id,
  event_title: r.event?.title ?? null,
});

/**
 * Read-only Heroes — the vertical, full-screen video pager mirroring the web
 * surface. The centered clip autoplays muted + looped; tapping toggles sound.
 * Likes hit hero_favorites (same RLS as web). Every Hero is tied to an event
 * (0034) so the event badge always has a target. Posting stays on web for now
 * (it needs event-confirmation + video capture).
 */
export default function HeroesScreen() {
  const router = useRouter();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const { favSet, toggle } = useHeroFavorites(heroes.map((h) => h.id));

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      supabase
        .from("heroes")
        .select(
          "id, media_path, poster_path, caption, expires_at, author_id, event_id, author:profiles!heroes_author_id_fkey(handle, display_name), event:events(title)",
        )
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(30)
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) setError(error.message);
          else {
            const list = ((data as unknown as HeroRow[]) ?? []).map(toHero);
            setHeroes(list);
            setActiveId((prev) => prev ?? list[0]?.id ?? null);
          }
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  // Stable identities — RN forbids changing these props on the fly, and useCallback
  // /useMemo keep them constant without reading a ref during render.
  const onViewable = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.item) setActiveId((first.item as Hero).id);
  }, []);
  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 60 }), []);

  if (heroes.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>NO HEROES RIGHT NOW</Text>
        <Text style={styles.emptyBody}>
          {error ?? "Heroes are short films that live for 24 hours, then vanish."}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      testID="heroes"
      data={heroes}
      keyExtractor={(h) => h.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={SCREEN_H}
      decelerationRate="fast"
      onViewableItemsChanged={onViewable}
      viewabilityConfig={viewabilityConfig}
      style={{ backgroundColor: BAUHAUS.ink }}
      renderItem={({ item }) => (
        <HeroPage
          hero={item}
          active={item.id === activeId}
          muted={muted}
          onToggleMuted={() => setMuted((m) => !m)}
          liked={favSet.has(item.id)}
          onLike={() => toggle(item.id)}
          onAuthor={() =>
            item.author_handle &&
            router.push({ pathname: "/u/[handle]", params: { handle: item.author_handle } })
          }
        />
      )}
    />
  );
}

function HeroPage({
  hero,
  active,
  muted,
  onToggleMuted,
  liked,
  onLike,
  onAuthor,
}: {
  hero: Hero;
  active: boolean;
  muted: boolean;
  onToggleMuted: () => void;
  liked: boolean;
  onLike: () => void;
  onAuthor: () => void;
}) {
  const player = useVideoPlayer(hero.media_url, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    // expo-video's player is an imperative object you mutate to control it —
    // that's the documented v57 API (the compiler's immutability rule can't know).
    // eslint-disable-next-line react-hooks/immutability
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    if (active) player.play();
    else player.pause();
  }, [active, player]);

  return (
    <Pressable onPress={onToggleMuted} style={styles.page}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
      />

      <View style={styles.countdown}>
        <Text style={styles.countdownText}>⏳ {heroCountdown(hero.expires_at)}</Text>
      </View>
      {muted ? (
        <View style={styles.muteHint}>
          <Text style={styles.muteHintText}>🔇 TAP FOR SOUND</Text>
        </View>
      ) : null}

      <View style={styles.overlay}>
        <View style={styles.left}>
          <Pressable onPress={onAuthor} hitSlop={6}>
            <Text style={styles.author}>
              {hero.author_name.toUpperCase()}
              {hero.author_handle ? ` · @${hero.author_handle}` : ""}
            </Text>
          </Pressable>
          {hero.caption ? <Text style={styles.caption}>{hero.caption}</Text> : null}
          {hero.event_title ? (
            <View style={styles.eventBadge}>
              <Text style={styles.eventText}>◆ {hero.event_title}</Text>
            </View>
          ) : null}
        </View>
        <Pressable onPress={onLike} hitSlop={8} style={styles.likeBtn}>
          <Text style={[styles.heart, liked && styles.heartOn]}>{liked ? "♥" : "♡"}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { height: SCREEN_H, width: "100%", backgroundColor: BAUHAUS.ink, justifyContent: "center" },
  countdown: {
    position: "absolute",
    right: 16,
    top: 16,
    borderWidth: 2,
    borderColor: BAUHAUS.paper,
    backgroundColor: "rgba(20,20,20,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countdownText: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, color: BAUHAUS.paper },
  muteHint: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    borderWidth: 2,
    borderColor: BAUHAUS.paper,
    backgroundColor: "rgba(20,20,20,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  muteHintText: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, color: BAUHAUS.paper },
  overlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 32,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
  },
  left: { flex: 1 },
  author: { fontFamily: FONT, fontSize: 12, letterSpacing: 1, color: BAUHAUS.paper },
  caption: { fontFamily: FONT_BODY, fontSize: 15, color: BAUHAUS.paper, marginTop: 6 },
  eventBadge: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderWidth: 2,
    borderColor: BAUHAUS.paper,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  eventText: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, color: BAUHAUS.paper },
  likeBtn: { alignItems: "center" },
  heart: { fontSize: 30, color: BAUHAUS.paper },
  heartOn: { color: BAUHAUS.red },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: BAUHAUS.paper },
  emptyTitle: { fontFamily: FONT, fontSize: 16, letterSpacing: 2, color: BAUHAUS.ink },
  emptyBody: { fontFamily: FONT_BODY, fontSize: 15, color: BAUHAUS.ink, marginTop: 10, textAlign: "center" },
});
