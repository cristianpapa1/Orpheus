"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Magic-link (email OTP) sign-in. */
export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/login?error=unconfigured");
  if (!email) redirect("/login?error=email");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${SITE_URL}/auth/callback` },
  });

  redirect(
    error
      ? `/login?error=${error.status === 429 ? "rate-limit" : "otp"}`
      : `/login?sent=1&email=${encodeURIComponent(email)}`,
  );
}

/**
 * Verify the 6-digit code from the sign-in email (no redirect needed — works in
 * the mobile WebView shell / in-app browser). Astelier doesn't own onboarding
 * (that's Atelier's); the gate on "/" handles the rest.
 */
export async function verifyEmailCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("code") ?? "").replace(/\s+/g, "");
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/login?error=unconfigured");
  const back = `/login?sent=1&email=${encodeURIComponent(email)}`;
  if (!email || !token) redirect(`${back}&error=code`);

  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) redirect(`${back}&error=code`);
  redirect("/");
}

/** Google OAuth sign-in. */
export async function signInWithGoogle() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/login?error=unconfigured");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${SITE_URL}/auth/callback` },
  });

  if (error || !data?.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createServerSupabase();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
