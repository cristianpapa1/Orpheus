import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * Service-role client — bypasses RLS. Used by the Stripe webhook to record
 * donations, and by admin-gated actions that must write a profile they don't
 * own (e.g. approving a profile claim → setting managed_by). Callers MUST
 * verify authorization first. Never import from client components;
 * "server-only" enforces it.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) return null;
  return createSupabaseClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
