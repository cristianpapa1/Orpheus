"use server";

import { sendEmail } from "@/lib/email/resend";
import { copyrightAgent } from "@/lib/legal/config";

export interface CopyrightNoticeInput {
  kind: "notice" | "counter"; // takedown notice vs counter-notice
  work: string; // the copyrighted work (or the removed work, for a counter)
  location: string; // URL(s) of the infringing / removed material
  name: string; // complainant's legal name (= electronic signature)
  email: string;
  address: string;
  phone?: string;
  statement: string; // free-text explanation
  goodFaith: boolean; // §512(c)(3)(A)(v) / consent-to-jurisdiction for counter
  accuracy: boolean; // §512(c)(3)(A)(vi) under penalty of perjury
  website?: string; // honeypot — real users never fill this
}

export interface CopyrightNoticeResult {
  ok: boolean;
  error?: string;
}

const clip = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);
const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Accept a copyright takedown notice or counter-notice and route it to the
 * designated agent. Public by design — a rights holder is usually not a member.
 * Email is the record of the notice (required for the safe-harbour); DB logging
 * and repeat-infringer strike tracking are a follow-up (needs a migration).
 */
export async function submitCopyrightNotice(
  raw: CopyrightNoticeInput,
): Promise<CopyrightNoticeResult> {
  // Honeypot: bots fill hidden fields. Pretend success, drop silently.
  if (clip(raw.website, 100)) return { ok: true };

  const kind = raw.kind === "counter" ? "counter" : "notice";
  const work = clip(raw.work, 4000);
  const location = clip(raw.location, 4000);
  const name = clip(raw.name, 200);
  const email = clip(raw.email, 200);
  const address = clip(raw.address, 1000);
  const phone = clip(raw.phone, 100);
  const statement = clip(raw.statement, 4000);

  if (!work || !location || !name || !address) {
    return { ok: false, error: "Please complete every required field." };
  }
  if (!looksLikeEmail(email)) {
    return { ok: false, error: "Enter a valid email so we can reach you." };
  }
  if (!raw.goodFaith || !raw.accuracy) {
    return { ok: false, error: "Both sworn statements are required to file." };
  }

  const agent = copyrightAgent();
  if (!agent.configured || !agent.email) {
    return {
      ok: false,
      error:
        "The copyright agent isn't configured yet. Please email your notice to the address shown on this page.",
    };
  }

  const label = kind === "counter" ? "COUNTER-NOTICE" : "TAKEDOWN NOTICE";
  const fields: [string, string][] = [
    ["Type", label],
    [kind === "counter" ? "Removed work" : "Copyrighted work", work],
    [kind === "counter" ? "Where it appeared (URL)" : "Infringing material (URL)", location],
    ["Name (electronic signature)", name],
    ["Email", email],
    ["Postal address", address],
    ["Phone", phone || "—"],
    ["Statement", statement || "—"],
    [
      kind === "counter"
        ? "Consents to jurisdiction & good-faith statement"
        : "Good-faith statement",
      "Affirmed",
    ],
    ["Accuracy, under penalty of perjury", "Affirmed"],
  ];

  const html =
    `<h2>Copyright ${esc(label)}</h2><table cellpadding="6" style="border-collapse:collapse">` +
    fields
      .map(
        ([k, v]) =>
          `<tr><td style="border:1px solid #ccc;font-weight:bold;vertical-align:top">${esc(k)}</td>` +
          `<td style="border:1px solid #ccc;white-space:pre-wrap">${esc(v)}</td></tr>`,
      )
      .join("") +
    `</table>`;
  const text = fields.map(([k, v]) => `${k}: ${v}`).join("\n\n");

  const sent = await sendEmail({
    to: agent.email,
    subject: `[Atelier] Copyright ${label} from ${name}`,
    html,
    text,
  });

  if (!sent) {
    return {
      ok: false,
      error: `Couldn't send right now. Please email your notice directly to ${agent.email}.`,
    };
  }

  // Acknowledge to the sender (best-effort; failure doesn't fail the filing).
  await sendEmail({
    to: email,
    subject: `We received your copyright ${kind === "counter" ? "counter-notice" : "notice"}`,
    html: `<p>Thank you — we&rsquo;ve received your ${esc(label.toLowerCase())} and forwarded it to our copyright agent. We&rsquo;ll follow up at this address.</p><p>Your submission:</p>${html}`,
    text: `We received your ${label.toLowerCase()} and forwarded it to our copyright agent.\n\n${text}`,
  });

  return { ok: true };
}
