# Video scale / transcoding — decision doc

_Status: DECISION PENDING (2026-07-20). Everything else this session (event
confirmation, Heroes event-gating, Heroes Phase 3, mobile Heroes viewer) is
shipped + pushed. This is the one item that needs a direction call before code._

## The problem

Today, Hero videos and video posts are **raw files uploaded straight to the
public Supabase Storage `media` bucket** and played back as-is:

- Web/mobile upload the original MP4 (client only caps size via
  `MEDIA_LIMITS.video.maxBytes`); no re-encode.
- Heroes generate a **poster** client-side (`extractVideoPoster`), but the video
  itself is untouched.
- Served through `media.aunflaneur.com` (Cloudflare Worker cache in front of
  Supabase). Good for caching, but it caches whatever bytes were uploaded.

At scale this bites: big uploads (slow + high egress), inconsistent codecs
(HEVC/odd profiles won't play on every device), no adaptive bitrate (mobile on
poor networks buffers), and storage growth (Heroes purge helps, but posts
persist).

## Options

| Option | HLS / adaptive | Cost | New infra/vendor | Fits our stack |
|---|---|---|---|---|
| **A. Cloudflare Stream** | ✅ managed | ~$5 / 1000 min stored + $1 / 1000 min delivered | Cloudflare (already ours) | ★ best — same account as the media CDN + Workers |
| **B. Client-side compress only** | ❌ | $0 | none | works, limited |
| **C. Self-hosted ffmpeg worker** | ✅ (DIY) | server box only | a worker box + queue | most ops |
| **D. Mux** | ✅ best DX | highest | new vendor | good, pricey |

### A. Cloudflare Stream (recommended)
Upload video to Stream (direct-creator-upload URL), store the returned `uid`
instead of a storage path; Stream transcodes to HLS + generates thumbnails +
serves adaptive bitrate from its own CDN. We already have the Cloudflare account,
Workers, and `media.aunflaneur.com`. Lowest-friction path to real
video-at-scale. Recurring cost scales with minutes (donation-budget relevant but
modest at our volume). **Needs: a Cloudflare API token with Stream perms +
account confirmation.**

### B. Client-side compression only (zero-cost quick win)
Re-encode/downscale before upload. Mobile: `react-native-compressor` (needs a
native module + EAS build). Web: `ffmpeg.wasm` (~30 MB, heavy) or MediaRecorder
re-encode (spotty support). No HLS/adaptive, quality tradeoffs, but no infra and
fully reversible. Good as a **complement** to A, not a full substitute.

### C. Self-hosted ffmpeg worker
A queue (Supabase table or Cloudflare Queue) + a small always-on box running
ffmpeg that pulls originals, transcodes to MP4(H.264)/HLS, writes back to the
bucket, flips a `status`. No SaaS bill, most ops + a box to run. Note: Supabase
Edge Functions and Vercel functions **can't** run ffmpeg reliably (time/size
limits) — this needs a real worker.

### D. Mux
Best video API/DX + analytics, but the priciest and a brand-new vendor. Hard to
justify against A given we're already on Cloudflare and donation-funded.

## Recommendation
**A (Cloudflare Stream) for the real pipeline**, optionally **B (client-side
compress)** layered on for immediate upload-size relief. A matches the existing
Cloudflare footprint, gives HLS/adaptive/thumbnails with near-zero ops, and keeps
cost proportional to actual usage.

## Why not built yet
This environment can't deploy the pipeline blind: A needs a Cloudflare Stream API
token + account choice; C needs a server box; both are cost/infra decisions that
are yours to make. Cloudflare MCP also can't auth in a headless session. Pick a
direction and it gets built + wired (upload flow, DB column for the video id/URL,
player swap to HLS, migration if needed).
