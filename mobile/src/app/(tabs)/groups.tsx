import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text } from "react-native";
import { Window } from "../../components/Window";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n/context";
import { BAUHAUS, FONT_BODY } from "../../theme";

interface Row {
  id: string;
  name: string;
  description: string;
  is_private: boolean;
}

export default function GroupsScreen() {
  const t = useT().groups;
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    supabase
      .from("groups")
      .select("id, name, description, is_private")
      .order("name")
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);

  return (
    <FlatList
      testID="groups"
      style={{ backgroundColor: BAUHAUS.paper }}
      contentContainerStyle={{ padding: 16 }}
      data={rows}
      keyExtractor={(r) => r.id}
      ListEmptyComponent={
        <Window title="Groups" accent="blue">
          <Text style={styles.body}>{t.empty}</Text>
        </Window>
      }
      renderItem={({ item, index }) => (
        <Window
          title={item.is_private ? `${item.name} · ${t.private}` : item.name}
          accent={(["blue", "yellow", "red"] as const)[index % 3]}
        >
          <Text style={styles.body}>{item.description}</Text>
        </Window>
      )}
    />
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: FONT_BODY, fontSize: 15, color: BAUHAUS.ink },
});
