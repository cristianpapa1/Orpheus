/**
 * Seed public-domain poems as text posts onto the poetry institutions.
 * Idempotent (skips a poem already posted by that handle). Run from atelier/:
 *   bun scripts/seed-poems.ts
 * All poems are public domain (authors long deceased / pre-1929 US works);
 * each is attributed to its author in the title.
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

interface Poem {
  handle: string;
  title: string;
  body: string;
}

const POEMS: Poem[] = [
  {
    handle: "poetryfoundation",
    title: "Hope is the thing with feathers — Emily Dickinson",
    body:
      "Hope is the thing with feathers -\nThat perches in the soul -\nAnd sings the tune without the words -\nAnd never stops - at all -\n\nAnd sweetest - in the Gale - is heard -\nAnd sore must be the storm -\nThat could abash the little Bird\nThat kept so many warm -\n\nI've heard it in the chillest land -\nAnd on the strangest Sea -\nYet - never - in Extremity,\nIt asked a crumb - of me.",
  },
  {
    handle: "poetryfoundation",
    title: "Nothing Gold Can Stay — Robert Frost",
    body:
      "Nature's first green is gold,\nHer hardest hue to hold.\nHer early leaf's a flower;\nBut only so an hour.\nThen leaf subsides to leaf.\nSo Eden sank to grief,\nSo dawn goes down to day.\nNothing gold can stay.",
  },
  {
    handle: "poetryfoundation",
    title: "The Tyger — William Blake",
    body:
      "Tyger Tyger, burning bright,\nIn the forests of the night;\nWhat immortal hand or eye,\nCould frame thy fearful symmetry?\n\nIn what distant deeps or skies.\nBurnt the fire of thine eyes?\nOn what wings dare he aspire?\nWhat the hand, dare seize the fire?\n\nAnd what shoulder, & what art,\nCould twist the sinews of thy heart?\nAnd when thy heart began to beat,\nWhat dread hand? & what dread feet?\n\nWhat the hammer? what the chain,\nIn what furnace was thy brain?\nWhat the anvil? what dread grasp,\nDare its deadly terrors clasp?\n\nWhen the stars threw down their spears\nAnd water'd heaven with their tears:\nDid he smile his work to see?\nDid he who made the Lamb make thee?\n\nTyger Tyger burning bright,\nIn the forests of the night:\nWhat immortal hand or eye,\nDare frame thy fearful symmetry?",
  },
  {
    handle: "parisreview",
    title: "In a Station of the Metro — Ezra Pound",
    body:
      "The apparition of these faces in the crowd;\nPetals on a wet, black bough.",
  },
  {
    handle: "parisreview",
    title: "O Captain! My Captain! — Walt Whitman",
    body:
      "O Captain! my Captain! our fearful trip is done,\nThe ship has weather'd every rack, the prize we sought is won,\nThe port is near, the bells I hear, the people all exulting,\nWhile follow eyes the steady keel, the vessel grim and daring;\n    But O heart! heart! heart!\n      O the bleeding drops of red,\n        Where on the deck my Captain lies,\n          Fallen cold and dead.\n\nO Captain! my Captain! rise up and hear the bells;\nRise up—for you the flag is flung—for you the bugle trills,\nFor you bouquets and ribbon'd wreaths—for you the shores a-crowding,\nFor you they call, the swaying mass, their eager faces turning;\n    Here Captain! dear father!\n      This arm beneath your head!\n        It is some dream that on the deck,\n          You've fallen cold and dead.",
  },
];

async function main() {
  for (const poem of POEMS) {
    const { data: prof } = await admin
      .from("profiles")
      .select("id")
      .eq("handle", poem.handle)
      .maybeSingle();
    if (!prof) {
      console.warn(`⚠️  @${poem.handle} not found — skipped`);
      continue;
    }
    // Idempotent: skip if this poem is already posted by this handle.
    const { count } = await admin
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", prof.id)
      .eq("caption", poem.title);
    if ((count ?? 0) > 0) {
      console.log(`• @${poem.handle}: "${poem.title}" already posted — skip`);
      continue;
    }
    const { error } = await admin.from("posts").insert({
      author_id: prof.id,
      caption: poem.title,
      category: "writing",
      subcategory: "poetry",
      body: poem.body,
      image_path: null,
      media_type: "text",
      variants: [],
      display: { frame: "plate", span: "standard", aspect: "natural" },
    });
    if (error) {
      console.warn(`⚠️  @${poem.handle} "${poem.title}": ${error.message}`);
      continue;
    }
    console.log(`✅ @${poem.handle}: posted "${poem.title}"`);
  }
}

main().catch((e) => {
  console.error("seed-poems failed:", e);
  process.exit(1);
});
