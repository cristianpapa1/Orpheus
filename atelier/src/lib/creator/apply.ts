import "server-only";
import type { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { cleanCreatorLinks, STATEMENT_MIN, STATEMENT_MAX } from "./limits";

/**
 * Shared "apply to be a creator" logic, used by onboarding (creator choice) and
 * the standalone /creator/apply page. Inserts the application under the user's
 * own client (RLS: profile_id = auth.uid()), then flips creator_status to
 * 'pending' via the service role — a normal session can't set that column
 * (guarded in 0026). Approval happens later in /admin/admissions.
 *
 * Pure limits/validation live in ./limits so the client forms can share them
 * without pulling this server-only module into their bundle.
 */

type Supa = NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;

export interface CreatorApplyInput {
  statement: string;
  links: string[];
}
export interface CreatorApplyResult {
  ok: boolean;
  error?: string;
}

export async function fileCreatorApplication(
  supabase: Supa,
  userId: string,
  input: CreatorApplyInput,
): Promise<CreatorApplyResult> {
  const statement = input.statement.trim().slice(0, STATEMENT_MAX);
  if (statement.length < STATEMENT_MIN) {
    return {
      ok: false,
      error: `Tell us more — at least ${STATEMENT_MIN} characters on what you'll post and why.`,
    };
  }
  const links = cleanCreatorLinks(input.links);
  if (links.length === 0) {
    return {
      ok: false,
      error: "Add at least one link to your work — a portfolio, socials, or published pieces.",
    };
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("creator_status")
    .eq("id", userId)
    .maybeSingle();
  if (prof?.creator_status === "approved") {
    return { ok: false, error: "You're already a creator." };
  }
  // Already under review — don't stack duplicate applications.
  if (prof?.creator_status === "pending") return { ok: true };

  const { error: insErr } = await supabase
    .from("creator_applications")
    .insert({ profile_id: userId, statement, links });
  if (insErr) {
    return { ok: false, error: "Couldn't file your application. Try again." };
  }

  const admin = createServiceClient();
  if (admin) {
    await admin
      .from("profiles")
      .update({ creator_status: "pending" })
      .eq("id", userId);
  }
  return { ok: true };
}
