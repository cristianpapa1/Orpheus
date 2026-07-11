import "server-only";
import {
  CATEGORY_LABEL,
  isPostCategory,
  subcategoryLabel,
} from "@atelier/core/posts/types";

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

const SYSTEM = `You are a content-moderation classifier for Atelier, a platform for creative work: music, writing & poetry, theater, film, dance, visual art, photography, and handmade craft.
Decide whether a post may be published. Respond with ONLY a compact JSON object, no prose:
{"decision":"approve|flag|reject","reason":"<=120 chars"}
- reject: sexually explicit content, graphic violence/gore, hate or harassment, illegal content, or blatant spam/advertising with no creative intent.
- flag: possibly off-topic, mismatched category, or borderline — a human should look.
- approve: plausible, safe creative work.
When unsure between approve and flag, choose flag. Never reject work merely for being amateur, low-resolution, or abstract.`;

function textPart(input: {
  caption?: string;
  category?: string;
  subcategory?: string | null;
  body?: string;
}): string {
  const cat = isPostCategory(input.category)
    ? CATEGORY_LABEL[input.category]
    : (input.category ?? "unspecified");
  const sub = input.subcategory ? ` / ${subcategoryLabel(input.subcategory)}` : "";
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
  subcategory?: string | null;
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
