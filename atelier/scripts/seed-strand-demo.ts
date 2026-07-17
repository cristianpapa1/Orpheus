/**
 * Demo: Strand Book Store — Astelier store (5 products) + an Atelier feed post
 * that links to their Astelier storefront ("Checkout at Astelier →").
 *
 * Strand (@strandbooks) already has an Astelier store from seed-stores.ts; this
 * tops the catalog up to 5 live products and publishes one Atelier post with a
 * checkout_url pointing at the store, so it appears in the feed of anyone who
 * follows Strand and exposes the cross-app Checkout button. Idempotent, service role.
 *
 *   bun scripts/seed-strand-demo.ts            # dry-run (plan only)
 *   bun scripts/seed-strand-demo.ts --commit   # write it
 */
import { createClient } from "@supabase/supabase-js";

const ASTELIER_URL = process.env.NEXT_PUBLIC_ASTELIER_URL ?? "https://astelier.aunflaneur.com";

const CATALOG = [
  { title: "Strand Classic Tote — Red", price_cents: 1995, description: "The famous red tote. Canvas, roomy, carries a lot of books." },
  { title: "Rare: Leaves of Grass, early printing", price_cents: 45000, description: "A collectible early printing from the rare book room." },
  { title: "Strand Enamel Mug", price_cents: 1600, description: "Sturdy enamel mug with the Strand mark." },
  { title: "Strand Gift Card — $50", price_cents: 5000, description: "Spend it on anything — books, totes, prints." },
  { title: "Used Paperback Bundle — 5 books", price_cents: 2400, description: "A hand-picked stack of five used paperbacks." },
];

const POST = {
  caption: "Fresh off the cart — shop the Strand",
  body: "18 miles of books, plus totes, mugs, and gift cards. Browse our shelves and check out on Astelier.",
};

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function commit() {
  const a = serviceClient();

  const { data: strand } = await a
    .from("profiles")
    .select("id, display_name")
    .eq("handle", "strandbooks")
    .single();
  if (!strand) throw new Error("@strandbooks profile not found");

  const { data: store } = await a
    .from("astelier_stores")
    .select("id, slug")
    .eq("owner_id", strand.id)
    .maybeSingle();
  if (!store) throw new Error("@strandbooks has no Astelier store — run astelier/scripts/seed-stores.ts first");

  // 1) Ensure the 5-product catalog (idempotent by title).
  const { data: existing } = await a
    .from("astelier_products")
    .select("title")
    .eq("store_id", store.id);
  const have = new Set((existing ?? []).map((p) => p.title));
  const toAdd = CATALOG.filter((p) => !have.has(p.title));
  if (toAdd.length) {
    const { error } = await a.from("astelier_products").insert(
      toAdd.map((p) => ({
        store_id: store.id,
        title: p.title,
        description: p.description,
        price_cents: p.price_cents,
        currency: "usd",
        disciplines: ["cat:writing"],
        status: "live",
      })),
    );
    if (error) throw new Error(`products: ${error.message}`);
  }
  console.log(`products: +${toAdd.length} (now ${(existing?.length ?? 0) + toAdd.length})`);

  // 2) Publish one Atelier post linking to the storefront (idempotent by caption).
  const checkout_url = `${ASTELIER_URL}/store/${store.slug}`;
  const { data: post } = await a
    .from("posts")
    .select("id")
    .eq("author_id", strand.id)
    .eq("caption", POST.caption)
    .maybeSingle();
  let postId = post?.id ?? null;
  if (!postId) {
    const { data: created, error } = await a
      .from("posts")
      .insert({
        author_id: strand.id,
        caption: POST.caption,
        body: POST.body,
        category: "writing",
        media_type: "text",
        checkout_url,
        display: { frame: "inset", span: "standard", aspect: "square" },
      })
      .select("id")
      .single();
    if (error || !created) throw new Error(`post: ${error?.message}`);
    postId = created.id;
  } else {
    // keep the checkout link current on re-run
    await a.from("posts").update({ checkout_url }).eq("id", postId);
  }
  console.log(`post: ${postId} → checkout_url ${checkout_url}`);
  console.log(`\nDone. Feed post live for followers of @${"strandbooks"}: /p/${postId}`);
  console.log(`Store: ${ASTELIER_URL}/store/${store.slug}`);
}

function dryRun() {
  console.log("DRY RUN — would ensure Strand's 5-product catalog + one Atelier post:");
  CATALOG.forEach((p) => console.log(`  · ${p.title} — $${(p.price_cents / 100).toFixed(2)}`));
  console.log(`  post: "${POST.caption}" → checkout_url ${ASTELIER_URL}/store/strandbooks`);
  console.log("\nRun with --commit to write it.");
}

async function main() {
  if (process.argv.includes("--commit")) await commit();
  else dryRun();
}

main().catch((e) => {
  console.error("seed-strand-demo failed:", e);
  process.exit(1);
});
