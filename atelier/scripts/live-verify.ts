/**
 * Live verification harness — closes the ISA's DEFERRED-VERIFY criteria
 * against the real Supabase project. Creates throwaway test users
 * (*.live-test@atelierdemo.dev), exercises every RLS surface, and prints
 * a JSON report. Never prints tokens or keys.
 * Run from atelier/: bun scripts/live-verify.ts   (Bun auto-loads .env.local)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const results: { step: string; pass: boolean; evidence: string }[] = [];
const ok = (step: string, pass: boolean, evidence: string) => {
  results.push({ step, pass, evidence });
  console.log(`${pass ? "✅" : "❌"} ${step} — ${evidence}`);
};

async function makeUser(tag: string) {
  const email = `${tag}.live-test@atelierdemo.dev`;
  const password = `LiveTest!${tag}-${Math.random().toString(36).slice(2, 10)}`;
  // Idempotent: delete an existing user with this email first.
  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 200 });
  const found = existing?.users.find((u) => u.email === email);
  if (found) await admin.auth.admin.deleteUser(found.id);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser ${tag}: ${error?.message}`);
  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: session, error: signInErr } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr || !session.session) throw new Error(`signIn ${tag}: ${signInErr?.message}`);
  return { id: data.user.id, email, client };
}

const sha256 = async (buf: ArrayBuffer) => {
  const h = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

// ── P0: auth round-trip + signup trigger ─────────────────────────
const A = await makeUser("ines");
const B = await makeUser("theo");
const C = await makeUser("nobody");
ok("P0 sign-up → sign-in round-trip", true, `3 users created+signed-in (${A.email} …)`);

const { data: profA } = await A.client.from("profiles").select("id, handle").eq("id", A.id).maybeSingle();
ok("P0 signup trigger created profile row", !!profA, `profiles row exists for A: ${!!profA}`);

// ── P1: profile save + follow + RLS negative ─────────────────────
const layoutA = { version: 1, blocks: [{ id: "bio", type: "bio", x: 0, y: 0, w: 12, h: 3 }] };
const { error: saveErr } = await A.client
  .from("profiles")
  .update({ handle: "ines_live", display_name: "Inês (live test)", school: "de-stijl", accent: "blue", layout: layoutA })
  .eq("id", A.id);
ok("P1 profile save (handle/school/layout)", !saveErr, saveErr?.message ?? "updated own row");

await B.client.from("profiles").update({ handle: "theo_live" }).eq("id", B.id);
const { error: followErr } = await B.client.from("follows").insert({ follower_id: B.id, followee_id: A.id });
ok("P1 follow A←B", !followErr, followErr?.message ?? "follows row inserted");

const { data: forged } = await B.client.from("profiles").update({ display_name: "hacked" }).eq("id", A.id).select();
ok("P1 RLS blocks B editing A's profile", (forged ?? []).length === 0, `rows affected: ${(forged ?? []).length}`);

const { error: selfFollowErr } = await A.client.from("follows").insert({ follower_id: A.id, followee_id: A.id });
ok("P1 self-follow rejected by DB constraint", !!selfFollowErr, selfFollowErr?.message?.slice(0, 60) ?? "UNEXPECTED SUCCESS");

// ── P2/P3: storage originals byte-identical + post insert ────────
const originalBytes = await Bun.file("public/demo/ines-1.svg").arrayBuffer();
const origPath = `${A.id}/originals/live-test.svg`;
const varPath = `${A.id}/display/live-test-800.svg`;
const up1 = await A.client.storage.from("media").upload(origPath, originalBytes, { contentType: "image/svg+xml", upsert: true });
const up2 = await A.client.storage.from("media").upload(varPath, originalBytes, { contentType: "image/svg+xml", upsert: true });
ok("P3 client-direct upload to own folder", !up1.error && !up2.error, up1.error?.message ?? "original + variant uploaded");

const pub = await fetch(`${URL}/storage/v1/object/public/media/${origPath}`);
const downloaded = await pub.arrayBuffer();
ok("P3 original byte-identical after round-trip", (await sha256(originalBytes)) === (await sha256(downloaded)), `sha256 match, ${downloaded.byteLength} bytes`);

const foreign = await B.client.storage.from("media").upload(`${A.id}/originals/forged.svg`, originalBytes, { contentType: "image/svg+xml" });
ok("P3 RLS blocks B writing into A's folder", !!foreign.error, foreign.error?.message?.slice(0, 60) ?? "UNEXPECTED SUCCESS");

const { data: post, error: postErr } = await A.client
  .from("posts")
  .insert({
    author_id: A.id,
    caption: "Live-test post — Fira, morning.",
    category: "photography",
    image_path: varPath,
    image_width: 800,
    image_height: 600,
    original_path: origPath,
    variants: [{ width: 800, path: varPath }],
    display: { frame: "full-bleed", span: "wide", aspect: "landscape" },
  })
  .select("id")
  .single();
ok("P2 publish post row", !!post && !postErr, postErr?.message ?? `post ${post?.id.slice(0, 8)}…`);

const { data: forgedPost } = await B.client
  .from("posts")
  .insert({ author_id: A.id, caption: "forged", category: "art", image_path: varPath })
  .select();
ok("P2 RLS blocks B posting as A", (forgedPost ?? []).length === 0, `rows: ${(forgedPost ?? []).length}`);

// ── P4: groups — create, invite, accept, tag; RLS negatives ─────
const { data: group, error: gErr } = await A.client
  .from("groups")
  .insert({ name: "Live Test Circle", slug: "live-test-circle", description: "Verification group", created_by: A.id })
  .select("id, slug")
  .single();
ok("P4 create group", !!group && !gErr, gErr?.message ?? group!.slug);

const { error: bootErr } = await A.client.from("group_members").insert({ group_id: group!.id, profile_id: A.id, role: "owner" });
ok("P4 creator bootstraps owner membership", !bootErr, bootErr?.message ?? "owner row via creator policy");

const { data: uninvited } = await C.client.from("group_members").insert({ group_id: group!.id, profile_id: C.id, role: "member" }).select();
ok("P4 RLS blocks uninvited self-join", (uninvited ?? []).length === 0, `rows: ${(uninvited ?? []).length}`);

await A.client.from("group_invites").insert({ group_id: group!.id, invitee_id: B.id, inviter_id: A.id });
const { error: joinErr } = await B.client.from("group_members").insert({ group_id: group!.id, profile_id: B.id, role: "member" });
ok("P4 invite → accept joins B", !joinErr, joinErr?.message ?? "B is a member via invite policy");

const { error: tagErr } = await A.client.from("post_groups").insert({ post_id: post!.id, group_id: group!.id });
ok("P4 author tags own post into own group", !tagErr, tagErr?.message ?? "post_groups row");

const { data: bTag } = await B.client.from("post_groups").insert({ post_id: post!.id, group_id: group!.id }).select();
ok("P4 RLS blocks non-author tagging A's post", (bTag ?? []).length === 0, `rows: ${(bTag ?? []).length}`);

// ── P5: chat — thread, messages, outsider blindness ──────────────
// Deliberately start from the participant with the GREATER uuid so the
// normalization trigger's swap path is exercised (the 0012 bug fix).
const starter = A.id > B.id ? A : B;
const other = A.id > B.id ? B : A;
const { data: thread, error: tErr } = await starter.client
  .from("chat_threads")
  .insert({ participant_a: starter.id, participant_b: other.id })
  .select("id, participant_a, participant_b")
  .single();
ok(
  "P5 start thread (swap path exercised)",
  !!thread && !tErr && thread.participant_a !== thread.participant_b,
  tErr?.message ?? `thread ${thread?.id.slice(0, 8)}…, normalized a<b: ${thread ? thread.participant_a < thread.participant_b : "n/a"}`,
);

if (thread) {
  await A.client.from("chat_messages").insert({ thread_id: thread.id, sender_id: A.id, body: "Live test: hello from A" });
  const { error: replyErr } = await B.client.from("chat_messages").insert({ thread_id: thread.id, sender_id: B.id, body: "Live test: B receives and replies" });
  const { data: msgs } = await B.client.from("chat_messages").select("body").eq("thread_id", thread.id);
  ok("P5 send + receive messages", !replyErr && (msgs ?? []).length === 2, `messages visible to B: ${(msgs ?? []).length}`);

  const { data: spy } = await C.client.from("chat_messages").select("body").eq("thread_id", thread.id);
  ok("P5 outsider reads zero messages", (spy ?? []).length === 0, `rows for C: ${(spy ?? []).length}`);
} else {
  ok("P5 send + receive messages", false, "skipped — thread creation failed (migration 0012 pending)");
  ok("P5 outsider reads zero messages", false, "skipped — thread creation failed");
}

// ── P6: events ───────────────────────────────────────────────────
const { error: evErr } = await A.client.from("events").insert({
  profile_id: A.id,
  title: "Live-test open studio",
  starts_at: new Date(Date.now() + 14 * 86400_000).toISOString(),
  location: "Lisbon",
  location_type: "venue",
  ticket_url: "https://example.com/live-test-tickets",
});
ok("P6 event insert with ticket link", !evErr, evErr?.message ?? "event row");

// ── P8: jobs ─────────────────────────────────────────────────────
const { data: job, error: jobErr } = await A.client
  .from("job_posts")
  .insert({ profile_id: A.id, title: "Live-test darkroom printer", discipline: "photography", work_mode: "on_site", location: "Lisbon", compensation: "€400" })
  .select("id")
  .single();
ok("P8 job post insert", !!job && !jobErr, jobErr?.message ?? "job row (status open)");
const { error: fillErr } = await A.client.from("job_posts").update({ status: "filled" }).eq("id", job!.id);
ok("P8 poster marks job filled", !fillErr, fillErr?.message ?? "status=filled");

// ── P9: reports + admin visibility ──────────────────────────────
const { error: repErr } = await B.client.from("reports").insert({
  reporter_id: B.id,
  subject_type: "post",
  subject_id: post!.id,
  reason: "other",
  detail: "Live-test report — please dismiss.",
});
ok("P9 file report", !repErr, repErr?.message ?? "report row");

await admin.from("profiles").update({ is_admin: true }).eq("id", A.id);
const { data: queue } = await A.client.from("reports").select("id, status");
ok("P9 admin reads the queue", (queue ?? []).length >= 1, `admin sees ${(queue ?? []).length} report(s)`);
const { data: cQueue } = await C.client.from("reports").select("id");
ok("P9 non-admin sees zero reports", (cQueue ?? []).length === 0, `rows for C: ${(cQueue ?? []).length}`);
const { error: dismissErr } = await A.client.from("reports").update({ status: "dismissed" }).eq("id", (queue ?? [])[0]?.id);
ok("P9 admin dismisses", !dismissErr, dismissErr?.message ?? "status=dismissed");

// ── summary ──────────────────────────────────────────────────────
const passed = results.filter((r) => r.pass).length;
console.log(`\nRESULT ${passed}/${results.length} passed`);
if (passed !== results.length) process.exit(1);
