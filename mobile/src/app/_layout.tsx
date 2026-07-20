import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BAUHAUS } from "../theme";

/** Minimal root: the app is a single WebView screen (index) rendering the
 *  responsive web app. No native tabs/gate — the web owns navigation + auth. */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: BAUHAUS.paper },
        }}
      />
    </SafeAreaProvider>
  );
}
