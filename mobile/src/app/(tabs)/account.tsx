import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Window } from "../../components/Window";
import { supabase } from "../../lib/supabase";
import { useI18n, useT } from "../../lib/i18n/context";
import { LOCALES } from "../../lib/i18n/config";
import { BAUHAUS, FONT, FONT_BODY } from "../../theme";

/** Real auth against the live project (email + password grant) + language. */
export default function AccountScreen() {
  const t = useT().account;
  const { locale, dir, setLocale } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    setStatus(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setStatus(error ? error.message : t.signedInMsg);
  };

  const align = dir === "rtl" ? "right" : "left";

  return (
    <ScrollView
      testID="account"
      style={{ backgroundColor: BAUHAUS.paper }}
      contentContainerStyle={{ padding: 16 }}
    >
      {session ? (
        <Window title={t.signedIn} accent="blue">
          <Text style={[styles.body, { textAlign: align }]}>{session.user.email}</Text>
          <Pressable style={styles.button} onPress={() => supabase.auth.signOut()}>
            <Text style={styles.buttonText}>{t.signOut.toUpperCase()}</Text>
          </Pressable>
        </Window>
      ) : (
        <Window title={t.signInTitle} accent="red">
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
          <TextInput
            testID="password"
            style={[styles.input, { textAlign: align }]}
            placeholder={t.password}
            placeholderTextColor="#8a877c"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Pressable style={styles.button} onPress={signIn}>
            <Text style={styles.buttonText}>{t.signIn.toUpperCase()}</Text>
          </Pressable>
          {status ? <Text style={[styles.body, { textAlign: align }]}>{status}</Text> : null}
        </Window>
      )}

      <Window title={t.language} accent="yellow">
        <View style={styles.langWrap}>
          {LOCALES.map((l) => {
            const active = l.code === locale;
            return (
              <Pressable
                key={l.code}
                testID={`lang-${l.code}`}
                onPress={() => setLocale(l.code)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {l.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Window>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: FONT_BODY, fontSize: 15, color: BAUHAUS.ink, marginTop: 8 },
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
  langWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 2,
    borderColor: BAUHAUS.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: BAUHAUS.ink },
  chipText: { fontFamily: FONT, fontSize: 12, letterSpacing: 1, color: BAUHAUS.ink },
  chipTextActive: { color: BAUHAUS.paper },
});
