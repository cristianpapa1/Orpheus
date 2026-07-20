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
 * the mobile WebView shell, an in-app browser, anywhere). The same email also
 * carries the magic link for desktop; this is the redirect-free alternative.
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

  // First login → onboarding (mirrors /auth/callback so the profile is reachable).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.onboarded_at) redirect("/onboarding");
  }
  redirect("/feed");
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
