import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import type { Session } from "@supabase/supabase-js";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { supabase } from "../lib/supabase";
import { I18nProvider } from "../lib/i18n/context";
import { BAUHAUS, FONT } from "../theme";

/** Root gate: no session → login screen; session → the tabs. */
export default function RootLayout() {
  const [loaded] = useFonts({ SpaceGrotesk_400Regular, SpaceGrotesk_700Bold });
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!loaded || !ready) {
    return <View style={{ flex: 1, backgroundColor: BAUHAUS.paper }} />;
  }

  return (
    <I18nProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: BAUHAUS.paper },
        }}
      >
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="u/[handle]"
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: BAUHAUS.paper },
              headerTitleStyle: { fontFamily: FONT },
              headerTintColor: BAUHAUS.ink,
              headerShadowVisible: false,
              title: "",
            }}
          />
          <Stack.Screen
            name="g/[slug]"
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: BAUHAUS.paper },
              headerTitleStyle: { fontFamily: FONT },
              headerTintColor: BAUHAUS.ink,
              headerShadowVisible: false,
              title: "",
            }}
          />
          <Stack.Screen
            name="p/[id]"
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: BAUHAUS.paper },
              headerTitleStyle: { fontFamily: FONT },
              headerTintColor: BAUHAUS.ink,
              headerShadowVisible: false,
              title: "",
            }}
          />
          <Stack.Screen
            name="compose"
            options={{
              headerShown: true,
              presentation: "modal",
              headerStyle: { backgroundColor: BAUHAUS.paper },
              headerTitleStyle: { fontFamily: FONT },
              headerTintColor: BAUHAUS.ink,
              headerShadowVisible: false,
              title: "",
            }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </I18nProvider>
  );
}
