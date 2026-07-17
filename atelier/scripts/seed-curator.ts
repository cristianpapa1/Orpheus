/**
 * Seed a working CURATOR test scenario (migration 0027).
 *
 * A profile becomes a curator automatically when it has ≥3 institutions that
 * mutually follow it AND it follows ≥30 quality-stamped accounts. This script
 * builds exactly that graph, entirely through the service role — NO SQL editor
 * needed for the data. (The tables + is_curator() function still come from
 * migration 0027, which must be applied once in the SQL editor; until then the
 * app reports the curator as "off" and the sample repost/rating are skipped.)
 *
 * All accounts share the email suffix `@curator-seed.atelier.local`, isolated
 * from the real institution seeds — so --purge removes only this scenario.
 *
 * Run from atelier/:
 *   bun scripts/seed-curator.ts            # dry-run: print the plan, no writes
 *   bun scripts/seed-curator.ts --commit   # create the accounts + follow graph
 *   bun scripts/seed-curator.ts --purge    # delete every @curator-seed account
 */
import { createClient } from "@supabase/supabase-js";

const SUFFIX = "@curator-seed.atelier.local";
const QUALITY_COUNT = 30;
const INSTITUTION_COUNT = 3;

const INSTITUTION_KINDS = ["museum", "gallery", "journal"] as const;

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (atelier/.env.local)");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
type Admin = ReturnType<typeof serviceClient>;

interface Account {
  email: string;
  handle: string;
  display_name: string;
  bio: string;
  account_type: "individual" | "institution";
  institution_kind?: string;
  quality_stamp?: boolean;
}

/** The full cast of the scenario. */
function plan(): { curator: Account; maker: Account; institutions: Account[]; quality: Account[] } {
  const curator: Account = {
    email: `curator${SUFFIX}`,
    handle: "curator_demo",
    display_name: "Ada — Curator (demo)",
    bio: "Demo curator. Reposts work as curated. (Seeded test account.)",
    account_type: "individual",
  };
  const maker: Account = {
    email: `maker${SUFFIX}`,
    handle: "maker_demo",
    display_name: "Marlow — Maker (demo)",
    bio: "Demo maker whose work gets curated. (Seeded test account.)",
    account_type: "individual",
  };
  const institutions: Account[] = Array.from({ length: INSTITUTION_COUNT }, (_, i) => ({
    email: `inst-${String(i + 1).padStart(2, "0")}${SUFFIX}`,
    handle: `inst_demo_${String(i + 1).padStart(2, "0")}`,
    display_name: `Demo Institution ${i + 1}`,
    bio: "Demo institution (seeded test account).",
    account_type: "institution",
    institution_kind: INSTITUTION_KINDS[i % INSTITUTION_KINDS.length],
  }));
  const quality: Account[] = Array.from({ length: QUALITY_COUNT }, (_, i) => ({
    email: `quality-${String(i + 1).padStart(2, "0")}${SUFFIX}`,
    handle: `quality_demo_${String(i + 1).padStart(2, "0")}`,
    display_name: `Quality Member ${String(i + 1).padStart(2, "0")}`,
    bio: "Demo quality-stamped member (seeded test account).",
    account_type: "individual",
    quality_stamp: true,
  }));
  return { curator, maker, institutions, quality };
}

async function loadUsers(admin: Admin): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const u of data?.users ?? []) if (u.email) map.set(u.email, u.id);
  return map;
}

async function ensureUser(admin: Admin, users: Map<string, string>, a: Account): Promise<string> {
  let id = users.get(a.email);
  if (!id) {
    const { data, error } = await admin.auth.admin.createUser({
      email: a.email,
      email_confirm: true,
      user_metadata: { seeded: true, scenario: "curator" },
    });
    if (error || !data.user) throw new Error(`createUser ${a.email}: ${error?.message}`);
    id = data.user.id;
    users.set(a.email, id);
  }
  const { error: upErr } = await admin
    .from("profiles")
    .update({
      handle: a.handle,
      display_name: a.display_name,
      bio: a.bio,
      account_type: a.account_type,
      institution_kind: a.institution_kind ?? null,
      quality_stamp: a.quality_stamp ?? false,
      creator_status: "approved",
      onboarded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (upErr) throw new Error(`profile ${a.handle}: ${upErr.message}`);
  return id;
}

/** Insert a follow, tolerating the "already following" duplicate. */
async function follow(admin: Admin, follower: string, followee: string): Promise<void> {
  const { error } = await admin.from("follows").insert({ follower_id: follower, followee_id: followee });
  if (error && error.code !== "23505") throw new Error(`follow: ${error.message}`);
}

/** Idempotently ensure the maker has one text post to curate; return its id. */
async function ensureMakerPost(admin: Admin, makerId: string): Promise<string> {
  const CAPTION = "Notes on light (demo)";
  const { data: existing } = await admin
    .from("posts")
    .select("id")
    .eq("author_id", makerId)
    .eq("caption", CAPTION)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await admin
    .from("posts")
    .insert({
      author_id: makerId,
      caption: CAPTION,
      category: "writing",
      body: "A short demo piece, here so a curator has something to repost as curated.",
      media_type: "text",
      display: { frame: "inset", span: "standard", aspect: "square" },
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`maker post: ${error?.message}`);
  return data.id;
}

const ASTELIER_URL = process.env.NEXT_PUBLIC_ASTELIER_URL ?? "https://astelier.aunflaneur.com";

/**
 * Give the maker their own Astelier store + one live product (the maker is an
 * approved creator, so they may own a shop), then point the curator's curation
 * buy link at that product — so the "Buy at Astelier →" button shows end-to-end.
 * Idempotent. Requires 0028 (store_url). Service role bypasses the app creator gate.
 */
async function ensureMakerShopLink(
  admin: Admin,
  makerId: string,
  curatorId: string,
  postId: string,
): Promise<void> {
  const { data: store, error: sErr } = await admin
    .from("astelier_stores")
    .upsert(
      {
        owner_id: makerId,
        name: "Marlow's Studio (demo)",
        slug: "maker-demo-shop",
        description: "Demo shop for the curator scenario.",
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id" },
    )
    .select("id")
    .single();
  if (sErr || !store) {
    console.warn(`  maker shop: ${sErr?.message}`);
    return;
  }

  const TITLE = "Notes on light — print (demo)";
  const { data: existing } = await admin
    .from("astelier_products")
    .select("id")
    .eq("store_id", store.id)
    .eq("title", TITLE)
    .maybeSingle();
  let productId = existing?.id ?? null;
  if (!productId) {
    const { data: prod, error: pErr } = await admin
      .from("astelier_products")
      .insert({
        store_id: store.id,
        title: TITLE,
        description: "A demo product a curator can link to.",
        price_cents: 4500,
        currency: "usd",
        status: "live",
      })
      .select("id")
      .single();
    if (pErr || !prod) {
      console.warn(`  maker product: ${pErr?.message}`);
      return;
    }
    productId = prod.id;
  }

  const url = `${ASTELIER_URL}/product/${productId}`;
  const { error: uErr } = await admin
    .from("post_curations")
    .update({ store_url: url })
    .eq("curator_id", curatorId)
    .eq("post_id", postId);
  if (uErr) console.warn(`  curation store_url: ${uErr.message}`);
  else console.log(`  ✅ maker shop + live product; curation buy link → ${url}`);
}

async function tableExists(admin: Admin, table: string): Promise<boolean> {
  // A plain select surfaces PostgREST's "table not in schema cache" (PGRST205)
  // as an error; a HEAD/count probe can mask it, so avoid that here.
  const { error } = await admin.from(table).select("*").limit(1);
  return !error;
}

async function commit(): Promise<void> {
  const admin = serviceClient();
  const { curator, maker, institutions, quality } = plan();
  const users = await loadUsers(admin);

  console.log("→ accounts…");
  const curatorId = await ensureUser(admin, users, curator);
  const makerId = await ensureUser(admin, users, maker);
  const instIds: string[] = [];
  for (const inst of institutions) instIds.push(await ensureUser(admin, users, inst));
  const qualityIds: string[] = [];
  for (const q of quality) qualityIds.push(await ensureUser(admin, users, q));
  console.log(`  curator @${curator.handle}, maker @${maker.handle}, ${instIds.length} institutions, ${qualityIds.length} quality members`);

  console.log("→ follow graph…");
  for (const qid of qualityIds) await follow(admin, curatorId, qid); // curator follows 30 quality
  for (const iid of instIds) {
    await follow(admin, curatorId, iid); // curator follows institution
    await follow(admin, iid, curatorId); // institution follows back (mutual)
  }
  console.log(`  curator follows ${qualityIds.length} quality + ${instIds.length} institutions (mutual)`);

  console.log("→ sample content…");
  const postId = await ensureMakerPost(admin, makerId);
  // Favorite (0016, always present) so the curator's Favorites gallery isn't empty.
  await admin
    .from("post_favorites")
    .insert({ post_id: postId, profile_id: curatorId })
    .then(({ error }) => {
      if (error && error.code !== "23505") console.warn(`  favorite: ${error.message}`);
    });

  // The repost + rating need migration 0027. Seed them only if it's applied.
  const has0027 = (await tableExists(admin, "post_curations")) && (await tableExists(admin, "post_ratings"));
  if (has0027) {
    let ok = true;
    const { error: curErr } = await admin
      .from("post_curations")
      .insert({ curator_id: curatorId, post_id: postId });
    if (curErr && curErr.code !== "23505") {
      ok = false;
      console.warn(`  curation: ${curErr.message}`);
    }
    const { error: rateErr } = await admin
      .from("post_ratings")
      .upsert(
        { profile_id: curatorId, post_id: postId, stars: 5, updated_at: new Date().toISOString() },
        { onConflict: "profile_id,post_id" },
      );
    if (rateErr) {
      ok = false;
      console.warn(`  rating: ${rateErr.message}`);
    }
    if (ok) console.log("  ✅ seeded a sample curation + 5★ rating");

    // 0028: attach an Astelier buy link (the maker's own product) to the curation.
    const has0028 = !(await admin.from("post_curations").select("store_url").limit(1)).error;
    if (has0028) await ensureMakerShopLink(admin, makerId, curatorId, postId);
    else console.log("  ⏭️  0028 store_url not applied — skipped the sample buy link.");
  } else {
    console.log("  ⏭️  migration 0027 not applied yet — skipped the sample repost + rating.");
    console.log("      Apply 0027 in the Supabase SQL editor, then re-run --commit to add them.");
  }

  // Confirm the curator qualifies (needs 0027 for is_curator()).
  const { data: isCur, error: rpcErr } = await admin.rpc("is_curator", { uid: curatorId });
  if (rpcErr) {
    console.log("\nis_curator(): unavailable (apply 0027) — graph is seeded and will qualify once it is.");
  } else {
    console.log(`\nis_curator(@${curator.handle}) = ${isCur ? "TRUE ✅ — curator is live" : "false (unexpected — check thresholds)"}`);
  }
  console.log(`\nDone. Sign in flow aside, view the curator at /u/${curator.handle} and the maker's post in the feed.`);
}

async function purge(): Promise<void> {
  const admin = serviceClient();
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const targets = (data?.users ?? []).filter((u) => u.email?.endsWith(SUFFIX));
  console.log(`Purging ${targets.length} @curator-seed accounts (cascades profiles/posts/follows)…`);
  for (const u of targets) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) console.warn(`  ${u.email}: ${error.message}`);
    else console.log(`  🗑️  ${u.email}`);
  }
  console.log("Done.");
}

function dryRun(): void {
  const { curator, maker, institutions, quality } = plan();
  console.log("DRY RUN — no writes. Would create these @curator-seed accounts:\n");
  console.log(`  1 curator   → @${curator.handle}`);
  console.log(`  1 maker     → @${maker.handle} (+ 1 text post to curate)`);
  console.log(`  ${institutions.length} institutions→ ${institutions.map((i) => "@" + i.handle).join(", ")}`);
  console.log(`  ${quality.length} quality    → @${quality[0].handle} … @${quality[quality.length - 1].handle} (quality_stamp)`);
  console.log("\nFollow graph:");
  console.log(`  curator → ${quality.length} quality members`);
  console.log(`  curator ⇄ ${institutions.length} institutions (mutual)`);
  console.log(`\n⇒ meets the bar: ${institutions.length} mutual institutions + ${quality.length} quality follows → curator.`);
  console.log("\nRun with --commit to write it (service role, idempotent). --purge to remove it.");
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--purge")) return purge();
  if (args.has("--commit")) return commit();
  dryRun();
}

main().catch((err) => {
  console.error("seed-curator failed:", err);
  process.exit(1);
});
