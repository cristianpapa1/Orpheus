import "server-only";

/**
 * Minimal transactional email via Resend. Best-effort: returns false on any
 * failure and never throws, so a missing key or a mail hiccup can't break the
 * action that triggered it. From-domain crktic.com is verified in Resend.
 */

const FROM = process.env.EMAIL_FROM ?? "Atelier <noreply@crktic.com>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.to) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.text ? { text: opts.text } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
