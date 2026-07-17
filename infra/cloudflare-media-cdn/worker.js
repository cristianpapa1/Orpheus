/**
 * media-cdn — serve the Atelier/Astelier public `media` bucket through
 * media.aunflaneur.com, with Cloudflare edge caching in front of Supabase.
 *
 * Why a Worker (not a bare CNAME): a CNAME proxied to Supabase would send the
 * Host header `media.aunflaneur.com`, which Supabase Storage won't route. The
 * Worker fetches the *full* Supabase origin URL, so Host/SNI are correct, and
 * it owns cache headers + optional hotlink protection in one place.
 *
 * URL mapping:  https://media.aunflaneur.com/<uid>/posts/<file>
 *            →  {SUPABASE_STORAGE_BASE}/<uid>/posts/<file>
 * (matches publicMediaUrl(path) = `${MEDIA_CDN}/${path}` in both apps.)
 *
 * Config (wrangler.toml [vars]):
 *   SUPABASE_STORAGE_BASE   the public media root, no trailing slash
 *                           e.g. https://<ref>.supabase.co/storage/v1/object/public/media
 *   ALLOWED_REFERER_HOSTS   optional CSV of referer hosts allowed to embed media
 *                           (empty = hotlink protection OFF — recommended until
 *                           you've confirmed it won't block link-preview scrapers).
 */
export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const base = (env.SUPABASE_STORAGE_BASE || "").replace(/\/+$/, "");
    if (!base) {
      return new Response("media-cdn misconfigured: set SUPABASE_STORAGE_BASE", {
        status: 500,
      });
    }

    const url = new URL(request.url);
    const objectPath = url.pathname.replace(/^\/+/, ""); // "<uid>/posts/<file>"
    if (!objectPath) return new Response("Not found", { status: 404 });

    // --- Optional hotlink protection (off unless ALLOWED_REFERER_HOSTS set) ---
    // Allows: same-site, listed hosts, and requests with NO referer (direct hits,
    // strict referrer policies). Blocks cross-site embedding. Note: enabling this
    // can affect social link-preview images — test before turning it on.
    const allow = (env.ALLOWED_REFERER_HOSTS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (allow.length) {
      const ref = request.headers.get("Referer");
      if (ref) {
        try {
          const host = new URL(ref).hostname;
          const ok = allow.some((h) => host === h || host.endsWith("." + h));
          if (!ok) return new Response("Forbidden (hotlink)", { status: 403 });
        } catch {
          /* malformed referer → allow through */
        }
      }
    }

    // --- Fetch from Supabase with Cloudflare edge caching ---------------------
    // Media paths are content-addressed (uuid filenames) → immutable → cache hard.
    const originUrl = `${base}/${objectPath}`;
    const originResponse = await fetch(originUrl, {
      method: request.method,
      cf: { cacheEverything: true, cacheTtl: 31536000 },
    });

    if (!originResponse.ok) {
      return new Response("Not found", { status: originResponse.status });
    }

    const headers = new Headers(originResponse.headers);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.delete("set-cookie");

    return new Response(originResponse.body, {
      status: originResponse.status,
      headers,
    });
  },
};
