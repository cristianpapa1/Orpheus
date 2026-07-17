/**
 * apex-redirect — 301 the bare apex (aunflaneur.com) to the Atelier app.
 *
 * The apex had no service behind the cloudflared tunnel (catch-all 404). Rather
 * than serve an app at the apex or edit the shared tunnel config, this runs at
 * the Cloudflare edge on a route (aunflaneur.com/*) and permanently redirects to
 * atelier.aunflaneur.com, preserving path + query. www is handled too if routed.
 */
export default {
  fetch(request) {
    const url = new URL(request.url);
    const target = `https://atelier.aunflaneur.com${url.pathname}${url.search}`;
    return Response.redirect(target, 301);
  },
};
