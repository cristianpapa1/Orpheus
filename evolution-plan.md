# Atelier — Evolution Plan (post-launch tracks A–C + mobile M0–M4)

> Directives from Cristian 2026-07-09. Execution order for the autonomous run:
> **M0 → M1 → C → B → A → M2 → M3 → M4** (cheap enablers first, Expo last).
> Mobile M0–M4 spec: `mobile-plan.md`. Each track = own ISA criteria + commit.

## Track A — Art schools / styles (beyond Bauhaus)

Today the whole site is Bauhaus (Gropius). Goal: creators choose the artistic
school their space converges to; the design system re-skins structurally.

- **Schools v1** (geometric-modernist set that fits the Window/facade system):
  `bauhaus` (default, Gropius) · `de-stijl` (Mondrian: primary planes, black
  gridlines, asymmetric balance) · `constructivism` (Rodchenko: red/black,
  diagonals, bold condensed type) · `swiss` (Müller-Brockmann: white space,
  grid purity, Helvetica-like neo-grotesque) · `memphis` (Sottsass: playful
  pastels+black squiggle accents — the one non-austere option).
- **Architecture**: one token contract, per-school override sets. CSS
  `[data-school="…"]` scopes override the SAME custom properties
  (--color-*, --text-*, border weights, motion curves, fonts via next/font).
  No component changes — Window/grid stay; only tokens swap.
- **Data**: `profiles.school` (check enum, default 'bauhaus'), editor picker
  (like the accent picker), `/u/[handle]` wraps ProfileCanvas in
  `data-school={profile.school}`. Site chrome stays Bauhaus; the creator's
  SPACE renders in their school (personalization principle).
- **Per-post option (directive #2)**: `PostDisplay.school?` — a post may pin a
  school for its own frame (falls back to author's school, then bauhaus).
  Extends the typed display config, parse-validated like frame/span/aspect.
- **/design styleguide** gains a school switcher to preview all five.

## Track B — Posts beyond images: short video + short audio

For filmmakers, theatre makers, musicians — Instagram/TikTok-style shorts but
for works: film clips, show excerpts, short music. Uploaded to OUR storage
(same originals-untouched principle).

- **Data**: `posts.media_type` check ('image','video','audio') default image;
  `media_path` (video/audio file), `duration_seconds` (cap: video ≤120s,
  audio ≤300s — server-validated), poster reuses existing image variant
  pipeline (client extracts a poster frame from the video via canvas;
  audio uses an optional cover image or a generated Bauhaus placeholder).
- **Upload**: client-direct to storage `{user}/media/…` (existing owner-folder
  policy covers it); MIME allowlist (mp4/webm/quicktime; mp3/m4a/ogg/wav);
  size caps (video ≤150MB, audio ≤30MB) client+server; duration read client-side
  from the media element and re-checked as metadata.
- **No server transcoding v1** — document Mux/Cloudflare Stream as the swap
  point (same pattern as the image-CDN note in migration 0004). Originals
  stay untouched; poster + duration make feeds cheap.
- **Playback**: feed card = poster + play glyph; tap → inline `<video controls
  playsInline preload="none" poster=…>` — NEVER autoplay with sound. Audio =
  minimal Bauhaus player (native `<audio controls preload="none">` styled).
  Detail page: full player + "view original" link. Gallery thumbs: poster
  with a media-type badge (▶ / ♪).
- **Composer**: media-type picker drives the input (image path unchanged);
  alt-text field doubles as description for AV; category/display/groups all
  apply identically.
- **A11y/anti**: captions field optional v1 (flagged in ISA as follow-up);
  anti-criterion: no autoplay-with-sound anywhere; no infinite-scroll
  dopamine loop — shorts render in the same chronological windowed feed.

## Track C — Global events list (small, do early)

Per-profile events exist (Phase 6). Add discovery: `/events` — every upcoming
event on the platform, chronological by `starts_at`, grouped by month, with
location-type filter (venue/online) + link to profile + ticket CTA. Needs
migration: global index on `events (starts_at)` where future. Entry points:
nav footer + events window block "All events →". Musicians/filmmakers scan
one list; nothing promoted, date order only.

## Standing rules for the autonomous run

- Same ISA discipline: append criteria per track (IDs continue from ISC-317),
  verify with probes, commit per track, DEFERRED-VERIFY for anything
  credential-gated. Preview mode: demo videos/audio (tiny bundled samples or
  SVG-poster stubs), demo schools on ines (de-stijl?) / theo (swiss?).
- bun only; no new heavy deps without noting in Decisions (video: none needed).
- If tokens run out mid-run: state is always resumable from ISA.md + this file.
