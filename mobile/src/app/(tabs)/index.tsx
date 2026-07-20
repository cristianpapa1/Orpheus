import { formatPostDate } from "@atelier/core/posts/types";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Dimensions, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Window } from "../../components/Window";
import { mediaUrl, supabase } from "../../lib/supabase";
import { useFavorites } from "../../lib/favorites";
import { localizedCategoryLabel } from "@atelier/core/taxonomy/i18n";
import { useI18n, useT } from "../../lib/i18n/context";
import { BAUHAUS, FONT, FONT_BODY } from "../../theme";

const CARD_W = Dimensions.get("window").width - 64;

interface Row {
  id: string;
  caption: string;
  category: string;
  media_type: "image" | "video" | "audio" | "text";
  image_path: string | null;
  images: string[] | null;
  body: string | null;
  created_at: string;
  author: { handle: string | null; display_name: string | null } | null;
}

const imgsOf = (r: Row): string[] =>
  r.images?.length ? r.images : r.image_path ? [r.image_path] : [];

/** Read-only latest work across the platform (public select, newest first).
 *  Handles every post kind, a ♥ favorite toggle, and tap-through to authors. */
export default function FeedScreen() {
  const dict = useT();
  const t = dict.feed;
  const { locale } = useI18n();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { favSet, toggle } = useFavorites(rows.map((r) => r.id));

  // Refetch whenever the tab regains focus — so a freshly composed post shows.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      supabase
        .from("posts")
        .select(
          "id, caption, category, media_type, image_path, images, body, created_at, author:profiles!posts_author_id_fkey(handle, display_name)",
        )
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) setError(error.message);
          else setRows((data as unknown as Row[]) ?? []);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const badge = (m: Row["media_type"]) =>
    m === "video" ? t.video : m === "audio" ? t.audio : m === "text" ? t.text : null;

  return (
    <FlatList
      testID="feed"
      style={{ backgroundColor: BAUHAUS.paper }}
      contentContainerStyle={styles.list}
      data={rows}
      keyExtractor={(r) => r.id}
      ListHeaderComponent={
        <Pressable style={styles.newPost} onPress={() => router.push("/compose")}>
          <Text style={styles.newPostText}>＋ {dict.compose.newPost.toUpperCase()}</Text>
        </Pressable>
      }
      ListEmptyComponent={
        <Window title="Feed" accent="red">
          <Text style={styles.body}>{error ?? t.empty}</Text>
        </Window>
      }
      renderItem={({ item, index }) => {
        const label = badge(item.media_type);
        const pics = imgsOf(item);
        return (
          <Window
            title={localizedCategoryLabel(item.category, locale)}
            accent={(["red", "blue", "yellow"] as const)[index % 3]}
          >
            {item.media_type !== "text" && pics.length ? (
              <View>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  style={{ width: CARD_W }}
                >
                  {pics.map((p, i) => (
                    <Image
                      key={i}
                      source={{ uri: mediaUrl(p) }}
                      style={[styles.image, { width: CARD_W }]}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
                {label ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{label.toUpperCase()}</Text>
                  </View>
                ) : null}
                {pics.length > 1 ? (
                  <View style={styles.countBadge}>
                    <Text style={styles.badgeText}>⊞ {pics.length}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
            <Pressable
              disabled={!item.author?.handle}
              onPress={() =>
                item.author?.handle &&
                router.push({ pathname: "/u/[handle]", params: { handle: item.author.handle } })
              }
            >
              <Text style={styles.meta}>
                {(item.author?.display_name ?? "Unnamed").toUpperCase()} · @
                {item.author?.handle ?? "?"} · {formatPostDate(item.created_at)}
              </Text>
            </Pressable>
            {item.caption ? <Text style={styles.body}>{item.caption}</Text> : null}
            {item.media_type === "text" && item.body ? (
              <Text style={styles.body}>{item.body}</Text>
            ) : null}
            <View style={styles.actions}>
              <Pressable onPress={() => toggle(item.id)} hitSlop={8}>
                <Text style={[styles.heart, favSet.has(item.id) && styles.heartOn]}>
                  {favSet.has(item.id) ? "♥" : "♡"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push({ pathname: "/p/[id]", params: { id: item.id } })}
                hitSlop={8}
              >
                <Text style={styles.openIcon}>💬</Text>
              </Pressable>
            </View>
          </Window>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  image: { width: "100%", aspectRatio: 4 / 3, borderWidth: 2, borderColor: BAUHAUS.ink },
  badge: {
    position: "absolute",
    left: 6,
    top: 6,
    backgroundColor: BAUHAUS.paper,
    borderWidth: 2,
    borderColor: BAUHAUS.ink,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  countBadge: {
    position: "absolute",
    right: 6,
    top: 6,
    backgroundColor: BAUHAUS.paper,
    borderWidth: 2,
    borderColor: BAUHAUS.ink,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: { fontFamily: FONT, fontSize: 10, letterSpacing: 1, color: BAUHAUS.ink },
  meta: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, marginTop: 8, color: BAUHAUS.ink },
  body: { fontFamily: FONT_BODY, fontSize: 15, marginTop: 6, color: BAUHAUS.ink },
  actions: { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 10 },
  heart: { fontSize: 22, color: BAUHAUS.ink },
  heartOn: { color: BAUHAUS.red },
  openIcon: { fontSize: 18 },
  newPost: { backgroundColor: BAUHAUS.ink, paddingVertical: 12, alignItems: "center", marginBottom: 16 },
  newPostText: { fontFamily: FONT, letterSpacing: 2, color: BAUHAUS.paper },
});
