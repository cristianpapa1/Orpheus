import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";
import { BAUHAUS, FONT } from "../theme";

/**
 * Landing for a magic-link tap: `atelier://auth-callback?code=…`. Exchanges the
 * PKCE code for a session (same as the web /auth/callback), then the root gate
 * swaps to the tabs. Google sign-in doesn't route through here — it completes
 * inside the in-app browser session (see lib/auth.ts).
 */
export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    (async () => {
      if (!code) {
        router.replace("/login");
        return;
      }
      const { error } = await supabase.auth.exchangeCodeForSession(String(code));
      if (error) {
        setError(error.message);
        return;
      }
      // Session is set; the root gate makes the tabs available.
      router.replace("/(tabs)");
    })();
  }, [code, router]);

  return (
    <View style={styles.wrap}>
      {error ? (
        <>
          <Text style={styles.title}>SIGN-IN FAILED</Text>
          <Text style={styles.body}>{error}</Text>
          <Text style={styles.link} onPress={() => router.replace("/login")}>
            ← Back to sign in
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator color={BAUHAUS.ink} />
          <Text style={styles.body}>Signing you in…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: BAUHAUS.paper, padding: 24 },
  title: { fontFamily: FONT, fontSize: 16, letterSpacing: 2, color: BAUHAUS.red },
  body: { fontFamily: FONT, fontSize: 12, letterSpacing: 1, color: BAUHAUS.ink, textAlign: "center" },
  link: { fontFamily: FONT, fontSize: 12, letterSpacing: 1, color: BAUHAUS.blue, marginTop: 8 },
});
