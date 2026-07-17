import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Resend webhook (Svix-signed). Verifies the signature, then suppresses the
 * addresses behind hard bounces and spam complaints so we stop emailing them
 * (see lib/email/resend.ts). Signature check first — nothing is processed on a
 * bad signature. Always 200s on a good signature so Resend doesn't retry-storm.
 *
 * Point the Resend webhook at: https://atelier.aunflaneur.com/api/resend/webhook
 */

/** Verify a Svix v1 signature. Constant-time; ±5-min timestamp tolerance (replay guard). */
function verifySvix(
  secret: string,
  id: string | null,
  timestamp: string | null,
  header: string | null,
  body: string,
): boolean {
  if (!id || !timestamp || !header) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto
    .createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  const expBuf = Buffer.from(expected);

  // Header is space-separated "v1,<base64sig>" pairs; any match passes.
  return header.split(" ").some((part) => {
    const comma = part.indexOf(",");
    const sig = comma === -1 ? part : part.slice(comma + 1);
    const sigBuf = Buffer.from(sig);
    return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
  });
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const body = await request.text();
  const ok = verifySvix(
    secret,
    request.headers.get("svix-id"),
    request.headers.get("svix-timestamp"),
    request.headers.get("svix-signature"),
    body,
  );
  if (!ok) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

  let event: { type?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const type = event.type ?? "unknown";

  // Suppress permanent failures: spam complaints, and HARD bounces only
  // (soft/transient bounces are retried by Resend and shouldn't suppress).
  if (type === "email.bounced" || type === "email.complained") {
    const data = event.data ?? {};
    const bounce = (data.bounce ?? {}) as Record<string, unknown>;
    const bounceType = String(bounce.type ?? data.bounceType ?? "").toLowerCase();
    const permanent = type === "email.complained" || /hard|permanent/.test(bounceType);

    const rawTo = data.to;
    const recipients = (Array.isArray(rawTo) ? rawTo : rawTo ? [rawTo] : [])
      .filter((e): e is string => typeof e === "string" && e.includes("@"))
      .map((e) => e.trim().toLowerCase());

    if (permanent && recipients.length) {
      const admin = createServiceClient();
      if (admin) {
        const reason = type === "email.complained" ? "complaint" : "bounce";
        const detail = String((bounce.message as string) ?? type).slice(0, 500);
        const rows = recipients.map((email) => ({ email, reason, detail }));
        const { error } = await admin
          .from("email_suppressions")
          .upsert(rows, { onConflict: "email" });
        if (error) console.warn(`[resend webhook] suppress failed: ${error.message}`);
        else console.log(`[resend webhook] suppressed ${recipients.length} (${reason})`);
      }
    }
  }

  console.log(`[resend webhook] ${type}`);
  return NextResponse.json({ received: true });
}
