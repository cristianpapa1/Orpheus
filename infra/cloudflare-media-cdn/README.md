# media-cdn — Cloudflare in front of the Supabase media bucket

Serve the shared `media` bucket (post images, product images, seed art) through
**`media.aunflaneur.com`** with Cloudflare edge caching, instead of hitting
Supabase directly on every request.

> Subdomain note: we use `media.` (not `cdn.`) because `cdn.aunflaneur.com` is
> already routed to catchyawn's MinIO in the cloudflared tunnel.

**What you get:** edge caching at Cloudflare's global PoPs (faster far-from-origin,
fewer round-trips), Supabase egress drops to **cache-misses only** (the cost win
without migrating storage), a clean custom CDN domain, and a single place to add
hotlink protection later. **No data migration, no upload changes** — Supabase
stays the origin and keeps its RLS-scoped upload path guards.

The app side is a single env-gated function (`publicMediaUrl` in both apps): set
`NEXT_PUBLIC_MEDIA_CDN_URL` → CDN; unset → direct Supabase. Fully reversible.

---

## Prerequisites
- `wrangler` CLI, logged into the **aunflaneur.com** Cloudflare account
  (`bunx wrangler login`) — note this is a different account than the tunnel.
- The `aunflaneur.com` zone active on that account (it is — the apex/subdomains
  already resolve through Cloudflare).

## Step 1 — confirm the origin
Open `wrangler.toml` and check `SUPABASE_STORAGE_BASE` equals your
`NEXT_PUBLIC_SUPABASE_URL` + `/storage/v1/object/public/media` (no trailing slash).

## Step 2 — deploy the Worker
```bash
cd infra/cloudflare-media-cdn
bunx wrangler deploy
```

## Step 3 — bind media.aunflaneur.com
**Recommended:** in the Cloudflare dashboard → Workers & Pages → `media-cdn` →
Settings → Domains & Routes → **Add Custom Domain** → `media.aunflaneur.com`.
Cloudflare provisions the proxied DNS record + TLS cert automatically.
*(Alternative: keep the `routes` entry in wrangler.toml and add a proxied DNS
record for `cdn` yourself.)*

## Step 4 — verify the CDN before flipping the app
Grab any live media path (open a post on the site, copy the image `src` — it's
`…supabase.co/storage/v1/object/public/media/<PATH>`), then test the same `<PATH>`
through the CDN:
```bash
curl -sI "https://media.aunflaneur.com/<PATH>" | grep -iE 'HTTP/|cf-cache-status|content-type|cache-control'
```
Expect `HTTP/2 200`, correct `content-type`, `cache-control: … immutable`, and a
`cf-cache-status` (MISS on the first hit, **HIT** on the second). If you get 404,
re-check `SUPABASE_STORAGE_BASE` and that `<PATH>` has no leading slash.

## Step 5 — flip the app env
Add to **both** `atelier/.env.local` and `astelier/.env.local` (or set in
Vercel/Fly project env if you've moved hosting):
```
NEXT_PUBLIC_MEDIA_CDN_URL=https://media.aunflaneur.com
```
`NEXT_PUBLIC_*` bakes in at build, so rebuild + restart:
```bash
cd atelier  && bun run build && systemctl --user restart atelier-web.service
cd astelier && bun run build && systemctl --user restart astelier-web.service
```
Then open a post — the image `src` should now be `https://media.aunflaneur.com/…`
and load normally.

## Rollback (instant)
Remove the `NEXT_PUBLIC_MEDIA_CDN_URL` line, rebuild + restart. URLs revert to
direct Supabase. The Worker can stay deployed (nothing points at it).

## Optional — hotlink protection
This Worker is the image proxy that makes real hotlink blocking possible (the
follow-up flagged earlier — media lives on `*.supabase.co`, which app headers
can't gate). To enable, set in `wrangler.toml`:
```
ALLOWED_REFERER_HOSTS = "aunflaneur.com"
```
and `bunx wrangler deploy`. It allows same-site + no-referer requests and blocks
cross-site embedding. **Caveat:** test social link previews first — some preview
scrapers send a foreign referer and would be blocked. Leave empty until verified.

---

## Notes / scope
- **Post images and product images** flow through `publicMediaUrl`, so they move
  to the CDN with the env flip. **Avatars** are stored in the DB as absolute
  `supabase.co` URLs, so they keep serving directly from Supabase for now — a
  later pass (store avatar *paths*, not URLs) would bring them onto the CDN too.
- This reduces Supabase egress to cache-misses; it does **not** eliminate
  Supabase Storage (still the origin + still where uploads land with RLS guards).
- If the bill still hurts after this, the next step is a full R2 cutover — a
  bigger refactor (upload paths + presigned-upload security model + data copy).
