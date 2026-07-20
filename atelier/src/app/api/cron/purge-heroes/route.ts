import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Heroes Phase 3 — the 24h purge. Expired Heroes are already invisible (their
 * RLS SELECT policy is `expires_at > now()`), but the rows + video/poster files
 * linger; this reclaims them. Runs as a Vercel Cron (see atelier/vercel.json).
 *
 * Auth: Vercel adds `Authorization: Bearer <CRON_SECRET>` to cron invocations
 * when CRON_SECRET is set on the project. We fail CLOSED — if the secret is
 * unset or the header doesn't match, we 401 (so this can't be poked publicly,
 * and the cron simply won't run until CRON_SECRET is configured).
 *
 * Needs env: CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY (service role bypasses the
 * live-only RLS to see + delete expired rows).
 */

export const dynamic = "force-dynamic";
// Deletions + storage removal — never cache, never prerender.
export const revalidate = 0;

async function purge(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "service role not configured" }, { status: 503 });
  }

  const nowIso = new Date().toISOString();
  const { data: expired, error } = await supabase
    .from("heroes")
    .select("id, media_path, poster_path")
    .lte("expires_at", nowIso)
    .limit(1000);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (expired ?? []) as { id: string; media_path: string; poster_path: string | null }[];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, purged: 0, objects: 0 });
  }

  // 1) Remove the media objects (best-effort — a missing file shouldn't block the row delete).
  const paths = rows.flatMap((r) =>
    [r.media_path, r.poster_path].filter((p): p is string => Boolean(p)),
  );
  if (paths.length) {
    await supabase.storage.from("media").remove(paths);
  }

  // 2) Delete the rows (cascades hero_views + hero_favorites).
  const ids = rows.map((r) => r.id);
  const { error: delErr } = await supabase.from("heroes").delete().in("id", ids);
  if (delErr) {
    return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, purged: ids.length, objects: paths.length });
}

// Vercel Cron invokes with GET; POST allowed for manual/authorized triggering.
export const GET = purge;
export const POST = purge;
