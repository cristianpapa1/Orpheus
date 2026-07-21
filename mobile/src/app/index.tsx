import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { BAUHAUS } from "../theme";

// The mobile app IS the responsive web app, wrapped natively — so it stays
// pixel-identical to the site and always in sync (one codebase). Override the
// target with EXPO_PUBLIC_SITE_URL if needed.
const SITE = (process.env.EXPO_PUBLIC_SITE_URL ?? "https://atelier.aunflaneur.com").replace(/\/+$/, "");
const SITE_HOST = SITE.replace(/^https?:\/\//, "").split("/")[0];

// The whole aunflaneur.com family is "the app" — Atelier (social), Astelier
// (commerce), the apex, and the media CDN. All of these stay INSIDE the WebView
// so links between the two products (e.g. "Shop at Astelier →") open in-app
// instead of bouncing to the system browser. Only truly external hosts (OAuth
// providers, other sites) are handed off.
const APP_DOMAIN = SITE_HOST.split(".").slice(-2).join("."); // e.g. aunflaneur.com
const isAppHost = (host: string) => host === APP_DOMAIN || host.endsWith(`.${APP_DOMAIN}`);

/**
 * Atelier — native shell around the responsive web app. Handles only the
 * shell concerns: safe area, a first-paint spinner, Android hardware-back →
 * web history, and sending mailto:/tel:/clearly-external links to the system
 * browser. Everything on the aunflaneur.com family (Atelier + Astelier + auth
 * callback) stays inside the WebView so the session + navigation live in one place.
 */
export default function App() {
  const webRef = useRef<WebView>(null);
  const canGoBack = useRef(false);
  const [loading, setLoading] = useState(true);

  // Android hardware back drives the web history; only falls through (exits)
  // when the WebView is already at the first page.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (canGoBack.current) {
          webRef.current?.goBack();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, []),
  );

  const onShouldStart = (req: WebViewNavigation): boolean => {
    const { url } = req;
    if (url.startsWith("mailto:") || url.startsWith("tel:")) {
      void Linking.openURL(url);
      return false;
    }
    // Keep the whole aunflaneur.com family (Atelier + Astelier + auth callback)
    // in the WebView; hand any other site to the system browser.
    if (/^https?:\/\//.test(url)) {
      const host = url.replace(/^https?:\/\//, "").split("/")[0];
      if (!isAppHost(host)) {
        void Linking.openURL(url);
        return false;
      }
    }
    return true;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <WebView
        ref={webRef}
        source={{ uri: SITE }}
        style={styles.web}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
        onShouldStartLoadWithRequest={onShouldStart}
        onNavigationStateChange={(nav) => {
          canGoBack.current = nav.canGoBack;
        }}
        onLoadEnd={() => setLoading(false)}
      />
      {loading ? (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator size="large" color={BAUHAUS.ink} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BAUHAUS.paper },
  web: { flex: 1, backgroundColor: BAUHAUS.paper },
  loader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BAUHAUS.paper,
  },
});
