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
      : "/login?sent=1",
  );
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
