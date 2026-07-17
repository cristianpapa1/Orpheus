// worker.js
var worker_default = {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    const base = (env.SUPABASE_STORAGE_BASE || "").replace(/\/+$/, "");
    if (!base) {
      return new Response("media-cdn misconfigured: set SUPABASE_STORAGE_BASE", {
        status: 500
      });
    }
    const url = new URL(request.url);
    const objectPath = url.pathname.replace(/^\/+/, "");
    if (!objectPath) return new Response("Not found", { status: 404 });
    const allow = (env.ALLOWED_REFERER_HOSTS || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (allow.length) {
      const ref = request.headers.get("Referer");
      if (ref) {
        try {
          const host = new URL(ref).hostname;
          const ok = allow.some((h) => host === h || host.endsWith("." + h));
          if (!ok) return new Response("Forbidden (hotlink)", { status: 403 });
        } catch {
        }
      }
    }
    const originUrl = `${base}/${objectPath}`;
    const originResponse = await fetch(originUrl, {
      method: request.method,
      cf: { cacheEverything: true, cacheTtl: 31536e3 }
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
      headers
    });
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
