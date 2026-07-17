import type { NextConfig } from "next";

/**
 * Security / anti-abuse headers applied to every response Astelier serves.
 *
 * Note on hotlinking: product media lives in the *public* shared Supabase
 * Storage bucket served from Supabase's own domain, so these headers can't gate
 * those image requests directly. They still tighten the referrer, prevent
 * framing, and carry the AI opt-out (X-Robots-Tag) alongside /robots.txt,
 * /ai.txt and tdmrep.json. Bucket-level hotlink blocking is a follow-up.
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
