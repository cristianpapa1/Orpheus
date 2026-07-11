/**
 * Institution seeding pipeline (Phase 13, Wave C).
 *
 *   1. Curated seed list of real cultural institutions (name, url, kind).
 *   2. Firecrawl scrape → title, description, hero image, links   (needs FIRECRAWL_API_KEY)
 *   3. Structure into a STAGING json for human review                (default: dry-run)
 *   4. --commit: upsert institution profiles + a starter group      (needs SUPABASE_SERVICE_ROLE_KEY)
 *
 * Seeded profiles are explicitly labeled community/unofficial until a real
 * owner claims them — we never impersonate. Run from atelier/:
 *   bun scripts/seed-institutions.ts                 # crawl + write staging, no DB writes
 *   bun scripts/seed-institutions.ts --skip-crawl    # re-use existing staging file
 *   bun scripts/seed-institutions.ts --commit        # write reviewed staging to the DB
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  isInstitutionKind,
  type InstitutionKind,
} from "@atelier/core/profile/types";

interface SeedInstitution {
  name: string;
  handle: string;
  url: string;
  kind: InstitutionKind;
  interests: string[];
}

/** The curated starter set — public, factual cultural institutions. */
const SEEDS: SeedInstitution[] = [
  { name: "Guggenheim", handle: "guggenheim", url: "https://www.guggenheim.org", kind: "museum", interests: ["cat:visual"] },
  { name: "MoMA", handle: "moma", url: "https://www.moma.org", kind: "museum", interests: ["cat:visual", "cat:film"] },
  { name: "Tate", handle: "tate", url: "https://www.tate.org.uk", kind: "museum", interests: ["cat:visual"] },
  { name: "The New Yorker", handle: "newyorker", url: "https://www.newyorker.com", kind: "journal", interests: ["cat:writing"] },
  { name: "The Paris Review", handle: "parisreview", url: "https://www.theparisreview.org", kind: "journal", interests: ["cat:writing"] },
  { name: "Poetry Foundation", handle: "poetryfoundation", url: "https://www.poetryfoundation.org", kind: "publisher", interests: ["cat:writing"] },
  { name: "The Criterion Collection", handle: "criterion", url: "https://www.criterion.com", kind: "label", interests: ["cat:film"] },
  { name: "A24", handle: "a24", url: "https://a24films.com", kind: "studio", interests: ["cat:film"] },
  { name: "Strand Book Store", handle: "strandbooks", url: "https://www.strandbooks.com", kind: "publisher", interests: ["cat:writing"] },
  { name: "Deutsche Grammophon", handle: "dgclassical", url: "https://www.deutschegrammophon.com", kind: "label", interests: ["cat:music"] },
  { name: "Radiotopia", handle: "radiotopia", url: "https://www.radiotopia.fm", kind: "podcast", interests: ["cat:writing", "cat:music"] },
  { name: "The Moth", handle: "themoth", url: "https://themoth.org", kind: "podcast", interests: ["cat:writing", "cat:theater"] },
];

const STAGING_PATH = join(import.meta.dir, "seed-staging", "institutions.json");

interface Scraped extends SeedInstitution {
  title: string;
  description: string;
  hero_image: string | null;
  links: { label: string; value: string; kind: "link" }[];
}

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;

/** Scrape one site via Firecrawl; falls back to metadata-only on error. */
async function scrape(seed: SeedInstitution): Promise<Scraped> {
  const base: Scraped = {
    ...seed,
    title: seed.name,
    description: `${seed.name} — community profile (unofficial until claimed).`,
    hero_image: null,
    links: [{ label: "Website", value: seed.url, kind: "link" }],
  };
  if (!FIRECRAWL_KEY) return base;

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_KEY}`,
      },
      body: JSON.stringify({ url: seed.url, formats: ["markdown"] }),
    });
    if (!res.ok) {
      console.warn(`⚠️  Firecrawl ${seed.handle}: HTTP ${res.status} — metadata only`);
      return base;
    }
    const json = (await res.json()) as {
      data?: { metadata?: Record<string, unknown> };
    };
    const meta = json.data?.metadata ?? {};
    const str = (v: unknown) => (typeof v === "string" ? v : undefined);
    return {
      ...base,
      title: str(meta.title) ?? base.title,
      description:
        (str(meta.description) ?? base.description).slice(0, 560) +
        " (Community profile — unofficial until claimed.)",
      hero_image: str(meta.ogImage) ?? str(meta["og:image"]) ?? null,
    };
  } catch (err) {
    console.warn(`⚠️  Firecrawl ${seed.handle} failed:`, err);
    return base;
  }
}

async function crawlAll(): Promise<Scraped[]> {
  const out: Scraped[] = [];
  for (const seed of SEEDS) {
    console.log(`🔎 ${seed.name} …`);
    out.push(await scrape(seed));
  }
  return out;
}

async function readStaging(): Promise<Scraped[]> {
  const raw = await readFile(STAGING_PATH, "utf8");
  return JSON.parse(raw) as Scraped[];
}

async function writeStaging(rows: Scraped[]): Promise<void> {
  await mkdir(dirname(STAGING_PATH), { recursive: true });
  await writeFile(STAGING_PATH, JSON.stringify(rows, null, 2));
  console.log(`📝 wrote ${rows.length} institutions → ${STAGING_PATH}`);
  console.log("   Review this file, then re-run with --commit to seed the DB.");
}

/** Commit reviewed staging rows to the DB using the service role. */
async function commit(rows: Scraped[]): Promise<void> {
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !SERVICE) {
    throw new Error("--commit needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
  }
  const admin = serviceClient(URL, SERVICE);

  for (const row of rows) {
    if (!isInstitutionKind(row.kind)) {
      console.warn(`⚠️  ${row.handle}: bad kind ${row.kind} — skipped`);
      continue;
    }
    const email = `${row.handle}@seed.atelier.local`;

    // Idempotent: reuse an existing seed user, else create one.
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    let userId = list?.users.find((u) => u.email === email)?.id;
    if (!userId) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { seeded: true, kind: row.kind },
      });
      if (error || !data.user) {
        console.warn(`⚠️  ${row.handle}: createUser failed — ${error?.message}`);
        continue;
      }
      userId = data.user.id;
    }

    const { error: upErr } = await admin
      .from("profiles")
      .update({
        handle: row.handle,
        display_name: row.name, // curated clean name, not the noisy page <title>
        bio: row.description,
        account_type: "institution",
        institution_kind: row.kind,
        interests: row.interests,
        links: row.links,
        onboarded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (upErr) {
      console.warn(`⚠️  ${row.handle}: profile update failed — ${upErr.message}`);
      continue;
    }

    // A starter group per institution, owned by the seed profile.
    const slug = `${row.handle}-community`.slice(0, 60);
    const { data: group } = await admin
      .from("groups")
      .upsert(
        {
          name: `${row.name} — Community`.slice(0, 60),
          slug,
          description: `Open group for people who follow ${row.name}.`.slice(0, 600),
          created_by: userId,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (group) {
      await admin
        .from("group_members")
        .upsert(
          { group_id: group.id, profile_id: userId, role: "owner" },
          { onConflict: "group_id,profile_id" },
        );
    }

    await seedHeroPost(admin, userId, row);
    console.log(`✅ seeded @${row.handle} (${row.kind}) + group ${slug}`);
  }
}

const IMG_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

function serviceClient(url: string, key: string) {
  return createClient(url, key, { auth: { persistSession: false } });
}
type Admin = ReturnType<typeof serviceClient>;

/**
 * Download an institution's hero image, store it in the media bucket, and
 * publish it as a single seed post so the profile's gallery isn't empty.
 * Idempotent: skips if the institution already has any post.
 */
async function seedHeroPost(admin: Admin, userId: string, row: Scraped) {
  if (!row.hero_image) return;
  const { count } = await admin
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", userId);
  if ((count ?? 0) > 0) return; // already has a post — don't duplicate

  let res: Response;
  try {
    res = await fetch(row.hero_image, { redirect: "follow" });
  } catch {
    console.warn(`  hero ${row.handle}: fetch failed`);
    return;
  }
  if (!res.ok) {
    console.warn(`  hero ${row.handle}: HTTP ${res.status}`);
    return;
  }
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  const ext = IMG_EXT[type] ?? row.hero_image.split(".").pop()?.slice(0, 4) ?? "jpg";
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > 15_000_000) {
    console.warn(`  hero ${row.handle}: skipped (${bytes.byteLength} bytes)`);
    return;
  }

  const path = `${userId}/seed/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await admin.storage
    .from("media")
    .upload(path, bytes, { contentType: type || "image/jpeg", upsert: true });
  if (upErr) {
    console.warn(`  hero ${row.handle}: upload ${upErr.message}`);
    return;
  }

  const category = row.interests.find((i) => i.startsWith("cat:"))?.slice(4) ?? "visual";
  const { error: postErr } = await admin.from("posts").insert({
    author_id: userId,
    caption: `${row.name} — from the archive`,
    category,
    image_path: path,
    variants: [{ width: 1200, path }],
    alt_text: row.name,
    media_type: "image",
    display: { frame: "inset", span: "standard", aspect: "landscape" },
  });
  if (postErr) {
    console.warn(`  hero ${row.handle}: post ${postErr.message}`);
    return;
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
  await admin.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
  console.log(`  🖼️  hero post for @${row.handle} (${category})`);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const rows =
    args.has("--skip-crawl") || args.has("--commit")
      ? await readStaging().catch(async () => {
          console.log("no staging file yet — crawling first");
          return crawlAll();
        })
      : await crawlAll();

  if (args.has("--commit")) {
    await commit(rows);
  } else {
    await writeStaging(rows);
    if (!FIRECRAWL_KEY) {
      console.log("\nℹ️  FIRECRAWL_API_KEY not set — wrote metadata-only staging.");
    }
  }
}

main().catch((err) => {
  console.error("seed-institutions failed:", err);
  process.exit(1);
});
