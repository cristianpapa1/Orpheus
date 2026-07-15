/**
 * Seed a few Astelier stores + products onto existing (seeded) institution
 * profiles, so the app looks alive. Idempotent. Run from astelier/:
 *   bun scripts/seed-stores.ts            # dry-run (prints what it would do)
 *   bun scripts/seed-stores.ts --commit   # write to the DB (service role)
 *
 * Stores attach to institution profiles seeded by atelier/scripts/seed-institutions.ts.
 */
import { createClient } from "@supabase/supabase-js";

interface SeedProduct {
  title: string;
  price: number; // USD major units
  description: string;
  discipline: string; // cat:*
  url: string; // external buy link
}
interface SeedStore {
  handle: string; // existing profile handle
  name: string;
  description: string;
  accent: "red" | "blue" | "yellow";
  products: SeedProduct[];
}

const SEEDS: SeedStore[] = [
  {
    handle: "strandbooks",
    name: "Strand Store",
    description: "Eighteen miles of books — and the totes, prints, and rarities to match.",
    accent: "red",
    products: [
      { title: "Strand Classic Tote — Red", price: 19.95, description: "The iconic red canvas tote. Sturdy, roomy, unmistakable.", discipline: "cat:handmade", url: "https://www.strandbooks.com" },
      { title: "Rare: Leaves of Grass, early printing", price: 450, description: "A collectible printing of Whitman, in very good condition.", discipline: "cat:writing", url: "https://www.strandbooks.com" },
      { title: "Strand Enamel Mug", price: 16, description: "Camp-style enamel mug with the Strand mark.", discipline: "cat:handmade", url: "https://www.strandbooks.com" },
    ],
  },
  {
    handle: "criterion",
    name: "Criterion Shop",
    description: "The film lover's shelf — restored classics in editions built to keep.",
    accent: "blue",
    products: [
      { title: "In the Mood for Love — 4K UHD", price: 49.95, description: "Wong Kar-wai's masterpiece, restored, with essays.", discipline: "cat:film", url: "https://www.criterion.com" },
      { title: "Tokyo Story — Blu-ray", price: 39.95, description: "Ozu's quiet devastation, in a definitive edition.", discipline: "cat:film", url: "https://www.criterion.com" },
    ],
  },
  {
    handle: "a24",
    name: "A24 Shop",
    description: "Merch, posters, and books from the studio behind the films.",
    accent: "yellow",
    products: [
      { title: "Screenplay Book — a24 Films", price: 30, description: "Annotated screenplay with photography and interviews.", discipline: "cat:film", url: "https://a24films.com" },
      { title: "Risograph Poster Set", price: 45, description: "A set of three riso-printed film posters.", discipline: "cat:visual", url: "https://a24films.com" },
      { title: "Studio Hoodie", price: 65, description: "Heavyweight cotton, embroidered mark.", discipline: "cat:handmade", url: "https://a24films.com" },
    ],
  },
  {
    handle: "poetryfoundation",
    name: "Poetry Foundation Store",
    description: "Anthologies, chapbooks, and broadsides for people who live in language.",
    accent: "red",
    products: [
      { title: "Broadside — a single poem, letterpressed", price: 28, description: "One poem, printed by hand on cotton paper. Suitable for framing.", discipline: "cat:writing", url: "https://www.poetryfoundation.org" },
      { title: "Anthology of Modern Verse", price: 24, description: "A wide, careful selection across a century.", discipline: "cat:writing", url: "https://www.poetryfoundation.org" },
    ],
  },
];

async function main() {
  const commit = process.argv.includes("--commit");
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !SERVICE) throw new Error("needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
  const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

  for (const seed of SEEDS) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("handle", seed.handle)
      .maybeSingle();
    if (!profile) {
      console.warn(`⚠️  @${seed.handle}: no profile — run seed-institutions first. skipped`);
      continue;
    }

    if (!commit) {
      console.log(`(dry) would seed store "${seed.name}" (@${seed.handle}) + ${seed.products.length} products`);
      continue;
    }

    const { data: store, error: sErr } = await admin
      .from("astelier_stores")
      .upsert(
        {
          owner_id: profile.id,
          name: seed.name,
          slug: seed.handle,
          description: seed.description,
          accent: seed.accent,
          school: "bauhaus",
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "owner_id" },
      )
      .select("id")
      .single();
    if (sErr || !store) {
      console.warn(`⚠️  ${seed.handle}: store upsert failed — ${sErr?.message}`);
      continue;
    }

    const { count } = await admin
      .from("astelier_products")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id);
    if ((count ?? 0) > 0) {
      console.log(`= @${seed.handle}: store ok, ${count} products already — skipping product insert`);
      continue;
    }

    const rows = seed.products.map((p) => ({
      store_id: store.id,
      title: p.title,
      description: p.description,
      price_cents: Math.round(p.price * 100),
      currency: "usd",
      images: [],
      disciplines: [p.discipline],
      external_url: p.url,
      status: "live",
    }));
    const { error: pErr } = await admin.from("astelier_products").insert(rows);
    if (pErr) {
      console.warn(`⚠️  ${seed.handle}: product insert failed — ${pErr.message}`);
      continue;
    }
    console.log(`✅ @${seed.handle}: store "${seed.name}" + ${rows.length} live products`);
  }
}

main().catch((err) => {
  console.error("seed-stores failed:", err);
  process.exit(1);
});
