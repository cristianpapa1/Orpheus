# Phase 16 — Heroes (ephemeral vertical short-video surface)

> Source: user session 2026-07-17. A TikTok/Stories-style vertical short-video
> tab, public to everyone, where each video lives **24 hours** and then vanishes
> — *"we can be heroes, just for one day"* (Bowie). Named **Heroes** deliberately
> to avoid Meta's "Reels"/"Stories" marks. Purpose: make the platform feel more
> alive and social, and tie short video to real experiences (a show, a film, a
> play, a gig) so an event's engagement becomes visible.

## Locked decisions (2026-07-17)
1. **Posting is open to any member** — everyone signed in can post a Hero (not
   creator-gated like posts). Heroes is the "everyone" surface. Every upload is
   still moderated by `moderate-hero`.
2. **Strictly 24h — nothing persists.** No feature/pin escape hatch. An event
   owner "re-sharing" a Hero = a **repost that is itself a fresh 24h Hero**. What
   lasts on an event is the **participant count + view count** (on the event
   tables), never the videos.
3. **Direct MP4 MVP** — play the uploaded H.264/AAC clip directly, no server
   transcoding. `moderate-hero` runs on the poster frame + caption, fail-open
   (same posture as `moderate-post`). Transcoding/CDN + full-video moderation are
   deferred to the scale phase.
4. **Center capture button** on mobile — a TikTok-style center action in the tab
   bar (custom `tabBarButton`) opens the Heroes pager + composer. No 6th tab. Web
   gets a top-level `/heroes` route.

## What already exists (foundation — shrinks the build)
- **Events** — `0007_events.sql` / `0011`: owner-owned, public, link-out tickets.
  **No RSVP / participants / views yet** → Phase 2 adds them.
- **Video posts** — `0011`: `posts.media_type in (image,video,audio)`, `media_path`,
  `duration_seconds` (video ≤120s) + a poster/variant pipeline + the `moderate-post`
  Edge Function. Heroes reuse the storage + poster + Claude-moderation *patterns*.
- **Share / send-to** — `atelier/src/components/posts/FavoritePost.tsx` already has
  the native share sheet + "send to your follows → drops the post into chat".
  Heroes reuse it verbatim.
- **Chat/DM** — `0006` / `0020` (web). "Send to" = drop into a DM. Mobile chat is
  still pending, so mobile send-to-DM waits on it; mobile native share works now.
- **Scheduled jobs** — none (no `pg_cron`). The 24h purge is a new mechanism.
- **Mobile video** — zero video libraries installed today. Heroes adds
  `expo-video` (playback) + a video picker/`expo-camera` (capture) +
  `expo-video-thumbnails` (poster).
- **Mobile tabs** — 5 already (feed/groups/events/jobs/account); highest migration
  is `0030`, so Heroes starts at `0031`.

## Data model (migrations from 0031)
- **`heroes`** — `id, author_id → profiles, media_path (video in storage),
  poster_path, width, height, duration_seconds (≤60–90s), caption, alt_text,
  event_id (nullable → events), created_at, expires_at (default now()+interval
  '24 hours')`, moderation fields. RLS:
  - **select**: public **where `expires_at > now()`** (via a SQL view or query filter),
  - **insert**: any authenticated user (`author_id = auth.uid()`) — moderated, not gated,
  - **delete**: author or admin.
- **`hero_views`** — `(hero_id, viewer_id)` unique → Hero view count + feeds event
  engagement. RLS: viewer inserts own; counts read by all (or via rpc).
- **`hero_favorites`** — mirror of `post_favorites` (likes). RLS same as favorites.
- **`event_participants`** — `(event_id, profile_id, status, created_at)` → the
  join/attend button + **Participants count**. RLS: self insert/delete; public count.
- **`event_views`** — `(event_id, viewer_id)` → event engagement/view count.
- `notifications.type` check gains `hero_like`, `event_join` (and `hero_mention`
  if @mentions land).

## Video pipeline & storage (MVP = direct MP4)
- Capture/pick a **vertical** clip (duration + size caps) → generate the poster
  frame **on-device** (`expo-video-thumbnails` on mobile; `<canvas>` capture or a
  first-frame grab on web) → upload video + poster to the `media` bucket under
  `{uid}/heroes/…` (owner-folder storage policy already covers it).
- **Playback**: web `<video>` autoplay/muted/loop in a CSS snap-scroll pager;
  mobile `expo-video` in a paged `FlatList` — autoplay current, preload next,
  pause the rest, tap-to-pause, mute toggle.
- **Scale path (deferred)**: Cloudflare Stream / Mux / HLS + adaptive thumbnails.
  Video **bandwidth is the biggest cost driver** — directly relevant to the
  Vercel/Supabase hosting move. Enforce duration + size caps from day one.

## Moderation
- New **`moderate-hero`** Edge Function (Deno), same fail-open Claude pattern as
  `moderate-post`: run on **poster frame + caption** (plus sampled frames later).
  Inserts as the caller so RLS applies. Reject → error; flag → publish + auto-report.
- Full-video + audio moderation = scale phase (dedicated service).

## Ephemerality — the "one day"
- **Source of truth = `expires_at`.** All public reads filter `expires_at > now()`
  → expired Heroes disappear instantly, no job needed to *hide* them.
- **Row + storage cleanup** = a scheduled purge (enable `pg_cron`, or a Supabase
  scheduled Edge Function) that deletes expired heroes + their storage objects +
  their views hourly/nightly.

## Surfaces
- **Mobile**: center capture button in the tab bar → full-screen vertical Heroes
  pager; overlay = author (→profile), caption, event chip (→event), ♥ like + count,
  👁 view count, share, send-to, report; Hero composer (record/pick → trim → caption
  → optional event → alt → publish via `moderate-hero`).
- **Web**: `/heroes` vertical snap pager + composer, mirroring mobile.
- **Events** (Phase 2): Join/Attend button + **Participants count** + view count +
  a **Heroes-from-this-event shelf** (live, within 24h) on the event detail.

## Social parity
Reuse posts' share (native sheet / copy-link) + send-to (drop into chat). Mobile
send-to-DM depends on the pending mobile chat; mobile native share + copy-link
work now.

## i18n
New `heroes` namespace + expanded `events` namespace across all **9 locales**
(en/fr/pt/de/ja/zh/ar/ru/it) in atelier + mobile. Core taxonomy still pending.

## Phased roadmap
1. **MVP — watch + post**: `heroes` + `hero_views` + `hero_favorites` (0031),
   `expires_at` filter, storage, vertical pager on mobile **and** web, Hero
   composer, `moderate-hero`, like + view count, native share, `heroes` i18n ×9.
2. **Events integration**: `event_participants` + Participants/join button,
   `event_views`, `event_id` linkage + Heroes-from-event shelf, owner re-share
   (as a fresh 24h Hero).
3. **Cleanup + polish**: scheduled purge job, notifications, send-to-chat parity
   (after mobile chat), full i18n sweep.
4. **Scale**: transcoding/CDN (Cloudflare Stream/Mux/HLS), fuller video + audio
   moderation, optional Hero comments/reactions.

## Deploy-safety
- All reads defensive (`heroes` / `hero_views` / `event_participants` → feature off
  when 0031 absent), matching the codebase's "silently [] pre-migration" pattern.
- Insert is moderated by `moderate-hero`; RLS still bounds paths to `{uid}/…`.
- Expired Heroes hidden by `expires_at` filter even before the purge job runs.

## Sequencing caveat (mobile needs an EAS build)
Mobile Heroes uses **native video modules** (`expo-video`, `expo-video-thumbnails`)
that are **not in Expo Go** — mobile Heroes can be *built* now but only *run/tested*
after **EAS re-init + a dev build** (on the pending list). The **web `/heroes`
surface has no such blocker** and can be built + verified live immediately →
**web-first is the fastest path to a working Hero**, mobile following the EAS build.

## Open (pre-existing, unrelated) pending items
Vercel import; mobile EAS re-init + production build; mobile chat/notifications/
profile-editor/admin; core taxonomy i18n; /terms + /privacy draft banners.
