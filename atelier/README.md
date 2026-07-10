# Atelier

A community-first social platform for creators — art, handmade, photography,
music. No ads, no pay-to-be-seen, no marketplace. Funded by donations.

Phased build plan: [`../atelier-build-plan.md`](../atelier-build-plan.md) ·
System of record: [`../ISA.md`](../ISA.md) · Design system: [`DESIGN.md`](DESIGN.md)

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · Supabase
(Postgres, Auth, Realtime, RLS) · framer-motion · **bun** (never npm/npx).

## Run it

```bash
bun install
cp .env.example .env.local   # add your Supabase URL + anon key
bun dev                      # http://localhost:3000
```

Without Supabase keys the app runs in **preview mode** — the Bauhaus shell
renders (Feed / Groups / Profile + /design styleguide) but sign-in is disabled.

## Database workflow

Migrations live in `supabase/migrations/` (plain SQL, ordered). Seed data in
`supabase/seed.sql`.

Local stack (requires the Supabase CLI + Docker):

```bash
bunx supabase init      # once, links this directory
bunx supabase start     # local Postgres + Auth + Studio
bunx supabase db reset  # applies all migrations, then seed.sql
```

Hosted project:

```bash
bunx supabase link --project-ref <ref>
bunx supabase db push   # applies pending migrations
```

Convention: new migrations are `supabase/migrations/NNNN_name.sql`, numbered
sequentially, never edited after they've been applied anywhere shared.

## Auth

Magic link (email OTP) + Google OAuth via `@supabase/ssr`. Session refresh and
route gating happen in `src/proxy.ts` (Next 16's middleware convention). The
three tabs are auth-gated when Supabase is configured.

## Phase status

- ✅ **Phase 0** — foundation, Bauhaus design system, auth shell
- ✅ **Phase 1** — profiles: drag/resize windowed editor (`/profile/edit`),
  server-rendered public pages (`/u/[handle]`), follow/unfollow. Layout engine
  is pure TS (`src/lib/profile/layout.ts`) with a bun test suite.
- ✅ **Phase 2** — posts & the main feed: create-post flow with client-side
  display optimization (`/post/new`), chronological follow-scoped feed,
  post detail (`/p/[id]`), profile gallery wired to real posts. Migration
  0003 adds `posts` + the public `media` storage bucket with owner-folder
  write policies.
- ✅ **Phase 3** — media pipeline & display personalization: originals stored
  byte-for-byte untouched (`{user}/originals/…`), client-generated WebP
  display variants served via srcset with blur-up placeholders, "view full
  resolution" on post detail, and per-post frame/span/aspect controls
  (typed `PostDisplay` config). Uploads go client→storage directly.
- ✅ **Phase 4** — groups & group feeds: create groups (public or private
  feed), member-vs-follower relationships (structurally distinct tables),
  invite + request-to-join flows with three RLS insert paths, post→group
  tagging at publish, group pages at `/g/[slug]`, and "also in [group]"
  markers in the main feed.
- ✅ **Phase 5** — private chat: 1:1 threads (`/chat`), participant-only RLS,
  optimistic sends, Message button on profiles. Realtime delivery, image
  sharing, and read state deferred to ATELIER-P5.1.
- ✅ **Phase 6** — events on profiles: `/profile/events` manager, events
  window block with upcoming-by-date + collapsed past events, ticket-link
  CTA (link-out only — no in-platform ticketing).
- ✅ **Phase 7** — donations: Stripe one-off + monthly checkout (`/donate`),
  webhook-recorded ledger (service role only — no client insert policy),
  admin appeals at `/admin/appeals` (manual trigger, audience targeting,
  goal/progress, on/off, per-appeal results) with a dismissible in-app
  banner channel. Requires STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET /
  SUPABASE_SERVICE_ROLE_KEY (see .env.example).
- ✅ **Phase 8** — job posts on profiles: post/manage at `/profile/jobs`
  (open/filled/closed), jobs window block on profiles (open listed,
  filled/closed collapsed), chronological filterable discovery at `/jobs`
  (discipline + work mode), apply via Atelier chat or external link.
- ✅ **Phase 9** — polish & launch prep: reporting + blocking + moderation
  queue (`/admin/reports`), advisory rate limits, a11y pass (skip link,
  focus-visible, alt text on media, keyboard-operable editor), onboarding
  (`/welcome`), profile accent personalization, /terms + /privacy drafts,
  and [`LAUNCH.md`](LAUNCH.md). **All nine phases complete** — launch is
  gated on credentials (see LAUNCH.md).
- ✅ **Evolution run** — M1 mobile bottom tab bar (safe-area, native-style);
  global `/events` discovery (month-grouped, chronological); posts beyond
  images: short video (≤2 min) + short audio (≤5 min) with tap-to-play
  players, duration badges, never autoplay; artistic **schools** — creators
  converge their space to Bauhaus, De Stijl, Constructivism, Swiss Style,
  or Memphis (per-post pinning supported; try `/design?school=memphis`).
- ⬜ Next: M0 monorepo extraction + M2–M4 Expo app (`../mobile-plan.md` — say "run M0")
