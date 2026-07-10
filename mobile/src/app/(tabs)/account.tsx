import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { Window } from "../../components/Window";
import { supabase } from "../../lib/supabase";
import { BAUHAUS, FONT, FONT_BODY } from "../../theme";

/** Real auth against the live project (email + password grant). */
export default function AccountScreen() {
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
    setStatus(error ? error.message : "Signed in.");
  };

  return (
    <ScrollView
      testID="account"
      style={{ backgroundColor: BAUHAUS.paper }}
      contentContainerStyle={{ padding: 16 }}
    >
      {session ? (
        <Window title="Signed in" accent="blue">
          <Text style={styles.body}>{session.user.email}</Text>
          <Pressable style={styles.button} onPress={() => supabase.auth.signOut()}>
            <Text style={styles.buttonText}>SIGN OUT</Text>
          </Pressable>
        </Window>
      ) : (
        <Window title="Sign in" accent="red">
          <TextInput
            testID="email"
            style={styles.input}
            placeholder="email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            testID="password"
            style={styles.input}
            placeholder="password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Pressable style={styles.button} onPress={signIn}>
            <Text style={styles.buttonText}>SIGN IN</Text>
          </Pressable>
          {status ? <Text style={styles.body}>{status}</Text> : null}
        </Window>
      )}
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
    backgroundColor: BAUHAUS.paper,
  },
  button: { backgroundColor: BAUHAUS.ink, padding: 12, alignItems: "center" },
  buttonText: { color: BAUHAUS.paper, fontFamily: FONT, letterSpacing: 2 },
});
