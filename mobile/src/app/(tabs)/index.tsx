import { formatPostDate } from "@atelier/core/posts/types";
import { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { Window } from "../../components/Window";
import { mediaUrl, supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n/context";
import { BAUHAUS, FONT, FONT_BODY } from "../../theme";

interface Row {
  id: string;
  caption: string;
  category: string;
  media_type: "image" | "video" | "audio" | "text";
  image_path: string | null;
  body: string | null;
  created_at: string;
  author: { handle: string | null; display_name: string | null } | null;
}

/** Read-only latest work across the platform (public select, newest first).
 *  Handles every post kind: image/video/audio show the cover, text shows body. */
export default function FeedScreen() {
  const t = useT().feed;
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("posts")
      .select(
        "id, caption, category, media_type, image_path, body, created_at, author:profiles!posts_author_id_fkey(handle, display_name)",
      )
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRows((data as unknown as Row[]) ?? []);
      });
  }, []);

  const badge = (m: Row["media_type"]) =>
    m === "video" ? t.video : m === "audio" ? t.audio : m === "text" ? t.text : null;

  return (
    <FlatList
      testID="feed"
      style={{ backgroundColor: BAUHAUS.paper }}
      contentContainerStyle={styles.list}
      data={rows}
      keyExtractor={(r) => r.id}
      ListEmptyComponent={
        <Window title="Feed" accent="red">
          <Text style={styles.body}>{error ?? t.empty}</Text>
        </Window>
      }
      renderItem={({ item, index }) => {
        const label = badge(item.media_type);
        return (
          <Window
            title={item.category}
            accent={(["red", "blue", "yellow"] as const)[index % 3]}
          >
            {item.media_type !== "text" && item.image_path ? (
              <View>
                <Image
                  source={{ uri: mediaUrl(item.image_path) }}
                  style={styles.image}
                  resizeMode="cover"
                />
                {label ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{label.toUpperCase()}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
            <Text style={styles.meta}>
              {(item.author?.display_name ?? "Unnamed").toUpperCase()} · @
              {item.author?.handle ?? "?"} · {formatPostDate(item.created_at)}
            </Text>
            {item.caption ? <Text style={styles.body}>{item.caption}</Text> : null}
            {item.media_type === "text" && item.body ? (
              <Text style={styles.body}>{item.body}</Text>
            ) : null}
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
  badgeText: { fontFamily: FONT, fontSize: 10, letterSpacing: 1, color: BAUHAUS.ink },
  meta: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, marginTop: 8, color: BAUHAUS.ink },
  body: { fontFamily: FONT_BODY, fontSize: 15, marginTop: 6, color: BAUHAUS.ink },
});
