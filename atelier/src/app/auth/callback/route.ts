import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// Behind the Cloudflare tunnel, the inferred request origin is the internal
// localhost address — always redirect against the configured public URL.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Exchanges the auth code from a magic link / OAuth redirect for a session. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // Only relative paths — never an absolute URL — may ride the next param.
  const rawNext = searchParams.get("next") ?? "/feed";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/feed";

  if (code) {
    const supabase = await createServerSupabase();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${SITE_URL}${next}`);
    }
  }

  return NextResponse.redirect(`${SITE_URL}/login?error=auth`);
}
