import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

export type AuthResult = { error: { message: string } | null; cancelled?: boolean };

/**
 * The deep link a magic link / OAuth redirect returns to. In a standalone build
 * this resolves to `atelier://auth-callback`; in Expo Go it's the `exp://` dev
 * URL. **This exact value must be listed in Supabase → Auth → URL Configuration
 * → Redirect URLs**, or the redirect is rejected.
 */
export function authRedirectUrl(): string {
  return Linking.createURL("auth-callback");
}

/**
 * Email the user a magic link (Supabase OTP), mirroring the web. Tapping it
 * opens the app at /auth-callback with a PKCE `code` we exchange for a session.
 */
export async function signInWithMagicLink(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: authRedirectUrl() },
  });
  return { error: error ? { message: error.message } : null };
}

/**
 * Google sign-in via Supabase's hosted OAuth, opened in an in-app browser. This
 * reuses the SAME Google provider the web app uses — the browser goes to
 * Supabase's /authorize endpoint (web Google client), then redirects back to the
 * app — so no native Google client ID / SHA-1 setup is required.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  const redirectTo = authRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) return { error: { message: error.message } };
  if (!data?.url) return { error: { message: "Couldn't start Google sign-in." } };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === "success" && result.url) return completeAuthFromUrl(result.url);
  if (result.type === "cancel" || result.type === "dismiss") return { error: null, cancelled: true };
  return { error: { message: "Google sign-in didn't complete." } };
}

/**
 * Turn an auth redirect URL into a session: PKCE `?code=…` (preferred, matches
 * the web callback) or an implicit `#access_token=…&refresh_token=…` fragment as
 * a fallback. `URLSearchParams` is polyfilled app-wide (react-native-url-polyfill).
 */
export async function completeAuthFromUrl(url: string): Promise<AuthResult> {
  const { queryParams } = Linking.parse(url);
  const code = typeof queryParams?.code === "string" ? queryParams.code : null;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return { error: error ? { message: error.message } : null };
  }
  const hashIndex = url.indexOf("#");
  if (hashIndex !== -1) {
    const frag = new URLSearchParams(url.slice(hashIndex + 1));
    const access_token = frag.get("access_token");
    const refresh_token = frag.get("refresh_token");
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      return { error: error ? { message: error.message } : null };
    }
  }
  return { error: { message: "No auth code in the sign-in link." } };
}
