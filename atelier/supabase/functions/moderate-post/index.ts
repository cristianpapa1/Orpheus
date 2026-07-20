// Supabase Edge Function: moderate-post
//
// The mobile app has no access to the web's server-action moderation, so it
// calls this function to publish. It runs the SAME Claude first-line filter as
// atelier/src/lib/moderation/ai.ts (fail-open), then inserts the post AS THE
// CALLER (RLS still enforces the approved-creator gate — this function is the
// moderation layer, not a privilege escalation). A "flag" verdict publishes and
// files an auto-report, matching the web.
//
// Deploy:  supabase functions deploy moderate-post
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   (MODERATION_MODEL optional)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = Deno.env.get("MODERATION_MODEL") ?? "claude-sonnet-4-6";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });

// Category ids kept in sync with @atelier/core/taxonomy (Edge Functions can't
// import the workspace package, so the id list is inlined). Styles are accepted
// as free string ids (capped at 3) — the app validates them per-category; here
// they're just sanitized. Keep this list in sync when the taxonomy changes.
const CATEGORIES = [
  "architecture", "sculpture", "painting", "drawing", "illustration", "photography",
  "film", "documentary", "music", "opera", "dance", "ballet", "theater", "performance",
  "circus", "puppetry", "poetry", "prose", "essay", "sequential-art", "video-games",
  "fashion", "product-design", "handmade", "jewelry", "furniture", "metalwork",
  "woodworking", "bookbinding", "calligraphy", "mosaic", "stained-glass",
];
const DEFAULT_DISPLAY = { frame: "inset", span: "standard", aspect: "natural" };

const SYSTEM = `You are a content-moderation classifier for Atelier, a platform for creative work across many disciplines — visual art, music, writing, film, performance, design, and craft.
Decide whether a post may be published. Respond with ONLY a compact JSON object, no prose:
{"decision":"approve|flag|reject","reason":"<=120 chars"}
- reject: sexually explicit content, graphic violence/gore, hate or harassment, illegal content, or blatant spam/advertising with no creative intent.
- flag: possibly off-topic, mismatched category, or borderline — a human should look.
- approve: plausible, safe creative work.
When unsure between approve and flag, choose flag. Never reject work merely for being amateur, low-resolution, or abstract.`;

type Decision = "approve" | "flag" | "reject";

async function moderate(input: {
  imageUrl: string | null;
  caption: string;
  category: string;
  body: string | null;
}): Promise<{ decision: Decision; reason: string }> {
  if (!ANTHROPIC_KEY) return { decision: "approve", reason: "moderation disabled (no key)" };
  const cat = input.category || "unspecified";
  const caption = (input.caption || "").slice(0, 500) || "(no caption)";
  const bodyPart = input.body ? `\nText of the work:\n"""${input.body.slice(0, 3000)}"""` : "";
  const content: Array<Record<string, unknown>> = [];
  if (input.imageUrl) content.push({ type: "image", source: { type: "url", url: input.imageUrl } });
  content.push({
    type: "text",
    text: `Stated category: ${cat}.\nCaption: "${caption}"${bodyPart}\nMay this be published on the platform?`,
  });
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 150, system: SYSTEM, messages: [{ role: "user", content }] }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { decision: "approve", reason: `moderation HTTP ${res.status}` };
    const jsonRes = await res.json();
    const text: string = jsonRes.content?.find((c: { type: string }) => c.type === "text")?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { decision: "approve", reason: "unparseable verdict" };
    const v = JSON.parse(match[0]);
    const decision: Decision = v.decision === "reject" ? "reject" : v.decision === "flag" ? "flag" : "approve";
    return { decision, reason: String(v.reason ?? "").slice(0, 160) };
  } catch (err) {
    return { decision: "approve", reason: err instanceof Error ? err.message : "moderation error" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });

  const auth = req.headers.get("Authorization");
  if (!auth) return json(401, { ok: false, error: "Sign in to publish." });
  const supabase = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json(401, { ok: false, error: "Sign in to publish." });

  // Creator gate (RLS re-checks on insert — this is the humane, early message).
  const { data: prof } = await supabase
    .from("profiles")
    .select("creator_status")
    .eq("id", user.id)
    .maybeSingle();
  if (prof?.creator_status !== "approved") {
    return json(200, { ok: false, error: "Only approved creators can publish." });
  }

  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return json(200, { ok: false, error: "Invalid request." });
  }

  const media_type = input.media_type === "text" ? "text" : "image";
  const caption = String(input.caption ?? "").trim().slice(0, 1000);
  const category = String(input.category ?? "");
  if (!CATEGORIES.includes(category)) return json(200, { ok: false, error: "Pick a category." });
  const styles = Array.isArray(input.styles)
    ? (input.styles as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 3)
    : [];

  const own = `${user.id}/`;
  const images = Array.isArray(input.images)
    ? (input.images as unknown[]).filter((p): p is string => typeof p === "string").slice(0, 10)
    : [];
  const body = String(input.body ?? "").trim().slice(0, 5000);

  if (media_type === "text") {
    if (!body) return json(200, { ok: false, error: "Write something to publish." });
  } else {
    if (images.length === 0) return json(200, { ok: false, error: "Add an image first." });
    if (images.some((p) => !p.startsWith(own) || p.includes(".."))) {
      return json(200, { ok: false, error: "Invalid media path." });
    }
  }

  const imageUrl = media_type === "image" && images[0]
    ? `${SUPABASE_URL}/storage/v1/object/public/media/${images[0]}`
    : null;
  const verdict = await moderate({ imageUrl, caption, category, body: media_type === "text" ? body : null });
  if (verdict.decision === "reject") {
    return json(200, {
      ok: false,
      error: `This didn't pass moderation: ${verdict.reason || "content not allowed here"}.`,
    });
  }

  const shared = {
    author_id: user.id,
    caption,
    category,
    subcategory: styles[0] ?? null,
    display: DEFAULT_DISPLAY,
    tags: [],
    checkout_url: null,
  };
  const row =
    media_type === "text"
      ? {
          ...shared, images: [], image_path: null, image_width: null, image_height: null,
          original_path: null, variants: [], blur_data: null, alt_text: null,
          media_type: "text", media_path: null, duration_seconds: null, body,
        }
      : {
          ...shared, images, image_path: images[0], original_path: images[0], variants: [],
          image_width: typeof input.image_width === "number" ? input.image_width : null,
          image_height: typeof input.image_height === "number" ? input.image_height : null,
          blur_data: null, alt_text: String(input.alt_text ?? "").trim().slice(0, 300) || null,
          media_type: "image", media_path: null, duration_seconds: null, body: null,
        };

  // Deploy-safe: if migration 0035 (posts.styles) isn't applied yet, retry without it.
  let ins = await supabase.from("posts").insert({ ...row, styles }).select("id").single();
  if (ins.error && /styles/i.test(ins.error.message)) {
    ins = await supabase.from("posts").insert(row).select("id").single();
  }
  const { data: post, error } = ins;
  if (error || !post) return json(200, { ok: false, error: error?.message ?? "Publish failed." });

  if (verdict.decision === "flag") {
    await supabase.from("reports").insert({
      reporter_id: user.id,
      subject_type: "post",
      subject_id: post.id,
      reason: "other",
      detail: `Auto-flagged by AI moderation: ${verdict.reason}`.slice(0, 600),
    });
  }

  return json(200, { ok: true, id: post.id, decision: verdict.decision });
});
