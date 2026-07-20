import "server-only";
import {
  CATEGORIES,
  categoryCanonicalLabel,
  styleCanonicalLabel,
} from "@atelier/core/taxonomy/taxonomy";

/**
 * AI content moderation (Claude vision). First-line filter on publish: keeps
 * clearly unsafe or off-topic work off the platform, and flags borderline
 * cases for human review. FAIL-OPEN by design — if the key is missing or the
 * call errors, we approve rather than block a legitimate creator.
 *
 * Model defaults to Sonnet (org policy: non-Sonnet models need sign-off).
 */

export type ModerationDecision = "approve" | "flag" | "reject";

export interface ModerationResult {
  decision: ModerationDecision;
  reason: string;
  /** false when we skipped the check (no key / infra error) → treated as approve. */
  checked: boolean;
}

const MODEL = process.env.MODERATION_MODEL ?? "claude-sonnet-4-6";

const SYSTEM = `You are a content-moderation classifier for Atelier, a platform for creative work across many disciplines — visual art, music, writing, film, performance, design, and craft.
Decide whether a post may be published. Respond with ONLY a compact JSON object, no prose:
{"decision":"approve|flag|reject","reason":"<=120 chars"}
- reject: sexually explicit content, graphic violence/gore, hate or harassment, illegal content, or blatant spam/advertising with no creative intent.
- flag: possibly off-topic, mismatched category, or borderline — a human should look.
- approve: plausible, safe creative work.
When unsure between approve and flag, choose flag. Never reject work merely for being amateur, low-resolution, or abstract.`;

function textPart(input: {
  caption?: string;
  category?: string;
  styles?: string[];
  body?: string;
}): string {
  const cat = input.category ? categoryCanonicalLabel(input.category) : "unspecified";
  const styleLabels = (input.styles ?? [])
    .map((s) => styleCanonicalLabel(input.category ?? "", s))
    .filter(Boolean);
  const sub = styleLabels.length ? ` / ${styleLabels.join(", ")}` : "";
  const caption = (input.caption ?? "").slice(0, 500) || "(no caption)";
  const body = input.body
    ? `\nText of the work:\n"""${input.body.slice(0, 3000)}"""`
    : "";
  return `Stated category: ${cat}${sub}.\nCaption: "${caption}"${body}\nMay this be published on the platform?`;
}

function parseVerdict(raw: string): ModerationResult {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { decision: "approve", reason: "unparseable verdict", checked: true };
  try {
    const v = JSON.parse(match[0]) as { decision?: string; reason?: string };
    const decision: ModerationDecision =
      v.decision === "reject" ? "reject" : v.decision === "flag" ? "flag" : "approve";
    return { decision, reason: String(v.reason ?? "").slice(0, 160), checked: true };
  } catch {
    return { decision: "approve", reason: "unparseable verdict", checked: true };
  }
}

const approveSkip = (reason: string): ModerationResult => ({
  decision: "approve",
  reason,
  checked: false,
});

export async function moderatePost(input: {
  imageUrl?: string | null;
  caption?: string;
  category?: string;
  styles?: string[];
  body?: string;
}): Promise<ModerationResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return approveSkip("moderation disabled (no key)");

  const content: Array<Record<string, unknown>> = [];
  if (input.imageUrl) {
    content.push({ type: "image", source: { type: "url", url: input.imageUrl } });
  }
  content.push({ type: "text", text: textPart(input) });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 150,
        system: SYSTEM,
        messages: [{ role: "user", content }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return approveSkip(`moderation HTTP ${res.status}`);
    const json = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text = json.content?.find((c) => c.type === "text")?.text ?? "";
    return parseVerdict(text);
  } catch (err) {
    return approveSkip(err instanceof Error ? err.message : "moderation error");
  }
}

/* ── AI auto-categorization ──────────────────────────────────────────────── */

export interface CategorizationResult {
  /** false when we skipped/failed (no key / infra error / bad output). */
  ok: boolean;
  /** A taxonomy category id, or "" when none could be chosen. */
  category: string;
  /** Up to three taxonomy style ids belonging to `category`. */
  styles: string[];
  /** Model's certainty in the CATEGORY, 0..1. */
  confidence: number;
}

// Compact catalog the model must classify into: category id → allowed style ids.
// Generated from the taxonomy so it can never drift out of sync.
const CATALOG = JSON.stringify(
  Object.fromEntries(CATEGORIES.map((c) => [c.id, c.styles.map((s) => s.id)])),
);

const CATEGORIZE_SYSTEM = `You classify a creative work into Atelier's FIXED taxonomy.
Respond with ONLY a compact JSON object, no prose:
{"category":"<category id>","styles":["<style id>", ...],"confidence":<number 0..1>}
Rules:
- Detect the primary artistic discipline and pick EXACTLY ONE category id from the catalog. Never invent categories.
- Pick UP TO THREE style ids, and ONLY ids listed under the chosen category in the catalog. Prefer existing styles; never invent new ones.
- "confidence" is your certainty in the CATEGORY (0..1). If you are genuinely unsure, return a low confidence.
Catalog (category id → allowed style ids):
${CATALOG}`;

/**
 * Detect a work's category + up to three styles (AI Categorization Rules).
 * FAIL-SOFT: returns ok:false (confidence 0) when the key is missing or the
 * call/output is bad, so the caller can fall back to asking the user. The
 * caller still re-validates styles against the category (validStyles).
 */
export async function categorizeWork(input: {
  imageUrl?: string | null;
  caption?: string;
  body?: string;
}): Promise<CategorizationResult> {
  const none: CategorizationResult = { ok: false, category: "", styles: [], confidence: 0 };
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return none;

  const content: Array<Record<string, unknown>> = [];
  if (input.imageUrl) {
    content.push({ type: "image", source: { type: "url", url: input.imageUrl } });
  }
  const caption = (input.caption ?? "").slice(0, 500) || "(no caption)";
  const body = input.body ? `\nText of the work:\n"""${input.body.slice(0, 3000)}"""` : "";
  content.push({ type: "text", text: `Caption: "${caption}"${body}\nClassify this work.` });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        system: CATEGORIZE_SYSTEM,
        messages: [{ role: "user", content }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return none;
    const json = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = json.content?.find((c) => c.type === "text")?.text ?? "";
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return none;
    const v = JSON.parse(m[0]) as { category?: unknown; styles?: unknown; confidence?: unknown };
    const category = typeof v.category === "string" ? v.category : "";
    const styles = Array.isArray(v.styles)
      ? v.styles.filter((s): s is string => typeof s === "string").slice(0, 3)
      : [];
    const confidence =
      typeof v.confidence === "number" ? Math.max(0, Math.min(1, v.confidence)) : 0;
    return { ok: true, category, styles, confidence };
  } catch {
    return none;
  }
}
