import { formatPostDate } from "@atelier/core/posts/types";
import { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text } from "react-native";
import { Window } from "../../components/Window";
import { mediaUrl, supabase } from "../../lib/supabase";
import { BAUHAUS, FONT, FONT_BODY } from "../../theme";

interface Row {
  id: string;
  caption: string;
  category: string;
  image_path: string;
  created_at: string;
  author: { handle: string | null; display_name: string | null } | null;
}

/** Read-only latest work across the platform (public select, newest first). */
export default function FeedScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("posts")
      .select("id, caption, category, image_path, created_at, author:profiles(handle, display_name)")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRows((data as unknown as Row[]) ?? []);
      });
  }, []);

  return (
    <FlatList
      testID="feed"
      style={{ backgroundColor: BAUHAUS.paper }}
      contentContainerStyle={styles.list}
      data={rows}
      keyExtractor={(r) => r.id}
      ListEmptyComponent={
        <Window title="Feed" accent="red">
          <Text style={styles.body}>{error ?? "Nothing published yet."}</Text>
        </Window>
      }
      renderItem={({ item, index }) => (
        <Window
          title={item.category}
          accent={(["red", "blue", "yellow"] as const)[index % 3]}
        >
          <Image
            source={{ uri: mediaUrl(item.image_path) }}
            style={styles.image}
            resizeMode="cover"
          />
          <Text style={styles.meta}>
            {(item.author?.display_name ?? "Unnamed").toUpperCase()} · @
            {item.author?.handle ?? "?"} · {formatPostDate(item.created_at)}
          </Text>
          {item.caption ? <Text style={styles.body}>{item.caption}</Text> : null}
        </Window>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  image: { width: "100%", aspectRatio: 4 / 3, borderWidth: 2, borderColor: BAUHAUS.ink },
  meta: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, marginTop: 8, color: BAUHAUS.ink },
  body: { fontFamily: FONT_BODY, fontSize: 15, marginTop: 6, color: BAUHAUS.ink },
});
