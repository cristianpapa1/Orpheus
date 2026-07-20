import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Window } from "../components/Window";
import { supabase } from "../lib/supabase";
import { signInWithGoogle, signInWithMagicLink } from "../lib/auth";
import { useI18n, useT } from "../lib/i18n/context";
import { BAUHAUS, FONT, FONT_BODY } from "../theme";

/** Entry gate — the facade's front door. Magic link + Google (mirrors the web),
 *  with email+password kept as a fallback. */
export default function LoginScreen() {
  const t = useT().login;
  const { dir } = useI18n();
  const align = dir === "rtl" ? "right" : "left";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // On success the root layout's session gate swaps to the tabs (or, for magic
  // link, /auth-callback completes it after the emailed link is tapped).
  const magicLink = async () => {
    if (!email.trim()) {
      setStatus("Enter your email first.");
      return;
    }
    setBusy(true);
    setStatus(null);
    const { error } = await signInWithMagicLink(email);
    setStatus(error ? error.message : "Check your email for a sign-in link.");
    setBusy(false);
  };

  const google = async () => {
    setBusy(true);
    setStatus(null);
    const { error, cancelled } = await signInWithGoogle();
    if (error) setStatus(error.message);
    else if (cancelled) setStatus(null);
    setBusy(false);
  };

  const run = async (mode: "in" | "up") => {
    setBusy(true);
    setStatus(null);
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setStatus(error ? error.message : mode === "up" ? t.confirm : null);
    setBusy(false);
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
      <Text style={styles.tagline}>{t.tagline}</Text>

      <Window title={t.signIn} accent="red">
        <TextInput
          testID="email"
          style={[styles.input, { textAlign: align }]}
          placeholder={t.email}
          placeholderTextColor="#8a877c"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Pressable testID="magic-link" style={styles.button} disabled={busy} onPress={magicLink}>
          <Text style={styles.buttonText}>{busy ? "…" : "EMAIL ME A MAGIC LINK"}</Text>
        </Pressable>
        <Pressable testID="google" style={styles.buttonAlt} disabled={busy} onPress={google}>
          <Text style={styles.buttonAltText}>CONTINUE WITH GOOGLE</Text>
        </Pressable>

        <Text style={styles.divider}>— OR USE A PASSWORD —</Text>

        <TextInput
          testID="password"
          style={[styles.input, { textAlign: align }]}
          placeholder={t.password}
          placeholderTextColor="#8a877c"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={styles.button} disabled={busy} onPress={() => run("in")}>
          <Text style={styles.buttonText}>{busy ? "…" : t.signInBtn.toUpperCase()}</Text>
        </Pressable>
        <Pressable style={styles.buttonAlt} disabled={busy} onPress={() => run("up")}>
          <Text style={styles.buttonAltText}>{t.createAccount.toUpperCase()}</Text>
        </Pressable>
        {status ? <Text style={styles.status}>{status}</Text> : null}
        <Text style={styles.hint}>{t.hint}</Text>
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
  divider: {
    fontFamily: FONT,
    fontSize: 11,
    letterSpacing: 1,
    textAlign: "center",
    color: BAUHAUS.ink,
    opacity: 0.5,
    marginVertical: 16,
  },
  status: { fontFamily: FONT, fontSize: 12, marginTop: 10, color: BAUHAUS.red },
  hint: { fontFamily: FONT_BODY, fontSize: 12, marginTop: 12, color: BAUHAUS.ink, opacity: 0.6 },
});
