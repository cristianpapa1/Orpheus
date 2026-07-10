import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Window } from "../components/Window";
import { supabase } from "../lib/supabase";
import { BAUHAUS, FONT, FONT_BODY } from "../theme";

/** Entry gate — the facade's front door. Sign in or create an account. */
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (mode: "in" | "up") => {
    setBusy(true);
    setStatus(null);
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setStatus(
      error
        ? error.message
        : mode === "up"
          ? "Check your inbox to confirm your email, then sign in."
          : null,
    );
    setBusy(false);
    // On successful sign-in the root layout's session gate swaps to the tabs.
  };

  return (
    <ScrollView
      testID="login"
      style={{ backgroundColor: BAUHAUS.paper }}
      contentContainerStyle={styles.wrap}
    >
      <View style={styles.brandRow}>
        <View style={[styles.square, { backgroundColor: BAUHAUS.red }]} />
        <View style={[styles.square, { backgroundColor: BAUHAUS.blue }]} />
        <View style={[styles.square, { backgroundColor: BAUHAUS.yellow }]} />
        <Text style={styles.brand}>ATELIER</Text>
      </View>
      <Text style={styles.tagline}>A place for makers.</Text>

      <Window title="Sign in" accent="red">
        <TextInput
          testID="email"
          style={styles.input}
          placeholder="email"
          placeholderTextColor="#8a877c"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          testID="password"
          style={styles.input}
          placeholder="password"
          placeholderTextColor="#8a877c"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={styles.button} disabled={busy} onPress={() => run("in")}>
          <Text style={styles.buttonText}>{busy ? "…" : "SIGN IN"}</Text>
        </Pressable>
        <Pressable style={styles.buttonAlt} disabled={busy} onPress={() => run("up")}>
          <Text style={styles.buttonAltText}>CREATE ACCOUNT</Text>
        </Pressable>
        {status ? <Text style={styles.status}>{status}</Text> : null}
        <Text style={styles.hint}>
          Magic-link and Google sign-in arrive with the next milestone — email +
          password works today.
        </Text>
      </Window>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, paddingTop: 80 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  square: { width: 14, height: 14 },
  brand: { fontFamily: FONT, fontSize: 28, letterSpacing: 2, marginLeft: 8, color: BAUHAUS.ink },
  tagline: { fontFamily: FONT_BODY, fontSize: 16, marginVertical: 16, color: BAUHAUS.ink },
  input: {
    borderWidth: 2,
    borderColor: BAUHAUS.ink,
    padding: 10,
    marginBottom: 10,
    fontFamily: FONT_BODY,
    color: BAUHAUS.ink,
    backgroundColor: BAUHAUS.paper,
  },
  button: { backgroundColor: BAUHAUS.ink, padding: 12, alignItems: "center" },
  buttonText: { color: BAUHAUS.paper, fontFamily: FONT, letterSpacing: 2 },
  buttonAlt: {
    borderWidth: 2,
    borderColor: BAUHAUS.ink,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonAltText: { color: BAUHAUS.ink, fontFamily: FONT, letterSpacing: 2 },
  status: { fontFamily: FONT, fontSize: 12, marginTop: 10, color: BAUHAUS.red },
  hint: { fontFamily: FONT_BODY, fontSize: 12, marginTop: 12, color: BAUHAUS.ink, opacity: 0.6 },
});
