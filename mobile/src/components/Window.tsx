import { StyleSheet, Text, View, type ViewProps } from "react-native";
import { BAUHAUS, FONT, type Palette } from "../theme";

/** The facade Window, native edition — same anatomy as the web primitive. */
export function Window({
  title,
  accent = "red",
  palette = BAUHAUS,
  children,
  style,
}: ViewProps & {
  title: string;
  accent?: "red" | "blue" | "yellow";
  palette?: Palette;
}) {
  return (
    <View
      testID="window"
      style={[styles.frame, { borderColor: palette.ink, backgroundColor: palette.paper }, style]}
    >
      <View style={[styles.header, { borderColor: palette.ink }]}>
        <View style={[styles.square, { backgroundColor: palette[accent] }]} />
        <Text style={[styles.title, { color: palette.ink }]}>{title.toUpperCase()}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderWidth: 2, marginBottom: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  square: { width: 10, height: 10 },
  title: { fontFamily: FONT, fontSize: 12, letterSpacing: 2 },
  body: { padding: 12 },
});
