import type { NextConfig } from "next";

/**
 * Security / anti-abuse headers applied to every response Atelier serves.
 *
 * Note on hotlinking: post media lives in a *public* Supabase Storage bucket
 * served from Supabase's own domain, so these headers can't gate those image
 * requests directly. What they do achieve: a tight Referrer-Policy (less leakage
 * when images are embedded elsewhere), frame protection, and a machine-readable
 * AI opt-out (X-Robots-Tag) alongside /robots.txt, /ai.txt and tdmrep.json.
 * True bucket-level hotlink blocking needs an image proxy or Supabase config —
 * tracked as a follow-up so we don't break the live image pipeline.
 */
const SECURITY_HEADERS = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Robots-Tag", value: "noai, noimageai" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // M0: compile the shared pure-TS core from the workspace package.
  transpilePackages: ["@atelier/core"],
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
