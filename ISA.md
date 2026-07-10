---
task: "Build Atelier Phase 8 job posts and discovery"
slug: 20260708-120400_develop-the-atelier-build-here-build
project: Atelier
effort: E3
effort_source: classifier
phase: execute
progress: 248/286
mode: interactive
started: 2026-07-08T15:04:39Z
updated: 2026-07-09T12:00:00Z
---

# Atelier — Project ISA

## Problem

The Atelier build plan (`atelier-build-plan.md`) exists but zero code does. There is no repo, no scaffold, no design system, no auth — nothing a creator could touch. Phase 0 is the foundation every later phase (profiles, feed, groups, chat, events, donations, jobs) plugs into; until it exists, the project is a document, not a platform.

## Vision

Opening the app for the first time feels like standing in front of a Gropius facade: black-and-white modular windows with red/blue/yellow accents, geometric type, generous negative space. Even empty, the three tabs read as a designed place — not a default Next.js template. A user signs in and immediately understands "this is a space I will build in."

## Out of Scope

Real content, posts, groups, chat, events, donations, and jobs (Phases 1–8). Video. Any marketplace, ads, paid promotion, or "seller" surface — permanently, by principle. Creator tipping (deferred by default). Live production deployment (Vercel/Supabase Cloud provisioning is a follow-up once credentials exist).

## Principles

- No pay-to-be-seen, ever — chronological, follow-driven surfaces only.
- The user builds their own space — the design system must anticipate deep personalization.
- Respect the work — media handling never silently degrades art (binds Phase 3, shapes token/pipeline choices now).
- Bauhaus discipline: functional geometry, primary accents on black/white, nothing decorative-for-decoration's-sake.

## Constraints

- Stack per plan: Next.js (App Router) + React + TypeScript + Tailwind; Supabase for auth/DB/realtime; framer-motion for windowed transitions.
- bun/bunx only — never npm/npx. TypeScript only — no Python.
- Supabase CLI and project credentials are absent in this environment: migrations ship as SQL files; live-auth verification is deferred, code must degrade gracefully without env vars.
- App lives in `atelier/` subdirectory; repo root is `/home/papac/projetos/Orpheus`.

## Goal

A signed-in user can navigate three empty tabs (Feed / Groups / Profile) rendered in a documented Bauhaus design system with a reusable `<Window>` primitive; auth (magic link + Google OAuth) and the DB migration/seed workflow are code-complete, and `bun run build` passes clean.

## Criteria

### Scaffold & repo
- [x] ISC-1: Git repo initialized at Orpheus root with an initial commit containing the plan + ISA
- [x] ISC-2: Next.js App Router app exists at `atelier/` with `tsconfig.json` (TypeScript)
- [x] ISC-3: Tailwind v4 wired (`@import "tailwindcss"` present in global stylesheet)
- [x] ISC-4: `bun run build` in `atelier/` exits 0
- [x] ISC-5: `bunx tsc --noEmit` exits 0
- [x] ISC-6: `bun.lock` present in `atelier/`

### Design tokens
- [x] ISC-7: Global stylesheet defines Bauhaus palette tokens: black, white, red, blue, yellow custom properties
- [x] ISC-8: Geometric sans-serif loaded via `next/font` and applied on `<body>`
- [x] ISC-9: Strict type-scale tokens defined (display/heading/body/caption steps)
- [x] ISC-10: Modular spacing/grid unit token defined (8px base)

### Window primitive, grid & motion
- [x] ISC-11: `Window` component exported from `components/ui/Window.tsx`
- [x] ISC-12: Window renders a title bar with a colored accent square and a content region (visible in served HTML)
- [x] ISC-13: Window accepts `accent` prop limited to `red | blue | yellow`
- [x] ISC-14: Motion presets module exports window open/close variants (framer-motion)
- [x] ISC-15: 12-column modular grid utility/component used by all three tab pages

### Documentation & styleguide
- [x] ISC-16: `DESIGN.md` documents palette, type scale, grid, and Window usage
- [x] ISC-17: `/design` styleguide route returns HTTP 200 and renders token swatches + Window examples

### App shell & navigation
- [x] ISC-18: `/feed` returns HTTP 200
- [x] ISC-19: `/groups` returns HTTP 200
- [x] ISC-20: `/profile` returns HTTP 200
- [x] ISC-21: Served nav HTML contains the three tabs Feed, Groups, Profile
- [x] ISC-22: `/` routes into the shell (200 or redirect to /feed / /login)
- [x] ISC-23: Each tab's empty state is composed of Window units (window markup present in served HTML)

### Auth
- [x] ISC-24: Supabase browser + server client modules exist using `@supabase/ssr`
- [x] ISC-25: `/login` returns 200 with an email sign-in form
- [x] ISC-26: Magic-link flow calls `signInWithOtp`
- [x] ISC-27: Google OAuth flow calls `signInWithOAuth`
- [x] ISC-28: `/auth/callback` route exchanges code for session (`exchangeCodeForSession`)
- [x] ISC-29: Sign-out action calls `auth.signOut`
- [x] ISC-30: Middleware refreshes the session and gates the three tabs when Supabase is configured
- [x] ISC-31: `.env.example` lists `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] ISC-32: With no Supabase env, app serves a setup notice instead of crashing (200 on /login)
- [DEFERRED-VERIFY] ISC-33: Live sign-up → login round-trip verified against a real Supabase project [follow-up: ATELIER-P0-AUTH-LIVE — create Supabase project, fill .env.local, run the round-trip]

### Database workflow
- [x] ISC-34: `supabase/migrations/0001_profiles.sql` creates `profiles` keyed to `auth.users`
- [x] ISC-35: Migration enables row level security with policies on `profiles`
- [x] ISC-36: Trigger auto-creates a profile row on new auth user
- [x] ISC-37: `supabase/seed.sql` present with sample data
- [x] ISC-38: README documents the migration + seed workflow commands

### Guards
- [x] ISC-39: Anti: no `package-lock.json` or `yarn.lock` anywhere in the repo
- [x] ISC-40: Anti: no ad/boost/promotion surface or code path exists (grep for sponsored|boost|promote finds nothing in app code)
- [x] ISC-41: Anti: token layer contains no non-Bauhaus hues (no green/purple/orange/pink tokens)
- [x] ISC-42: Antecedent: all three tab pages import and compose the Window primitive (the Bauhaus feel comes from the primitive, not per-page CSS)

### Phase 1 — data model & layout engine
- [x] ISC-43: Migration 0002 adds `links jsonb` to `public.profiles`
- [x] ISC-44: Migration 0002 creates `follows` table with composite PK and a no-self-follow check constraint
- [x] ISC-45: `follows` has RLS enabled with public-select and own-row insert/delete policies
- [x] ISC-46: `src/lib/profile/layout.ts` exports `ProfileLayout` types and `DEFAULT_LAYOUT`
- [x] ISC-47: `parseLayout` returns a valid layout for garbage input (falls back to default)
- [x] ISC-48: `moveBlock` clamps blocks inside the 12-column grid bounds
- [x] ISC-49: `resizeBlock` enforces per-block-type minimum sizes
- [x] ISC-50: Collision resolution pushes overlapped blocks down — result has zero overlaps
- [x] ISC-51: `compactVertical` removes vertical gaps and is idempotent
- [x] ISC-52: `bun test` layout-engine suite passes (≥10 tests, exit 0)

### Phase 1 — profile editor
- [x] ISC-53: `/profile/edit` returns HTTP 200
- [x] ISC-54: Editor canvas renders layout blocks with `data-block` markers
- [x] ISC-55: Blocks are draggable by their title bar (pointer handlers wired to grid-snap move math)
- [x] ISC-56: Each block has a corner resize handle wired to resize math
- [x] ISC-57: Palette adds block types not already on the canvas
- [x] ISC-58: Blocks are removable from the canvas
- [x] ISC-59: Save persists via a server action updating `profiles` (layout + identity + links)
- [x] ISC-60: Preview mode save falls back to localStorage with a visible notice (no crash)
- [x] ISC-61: Identity fields (display name, handle, bio, links) are editable in the editor
- [x] ISC-62: Editor route is auth-gated when Supabase is configured (under /profile matcher)

### Phase 1 — public profile view
- [x] ISC-63: `/u/[handle]` server-renders a profile (200 for demo handle in preview mode)
- [x] ISC-64: Rendered blocks are placed per layout config (inline gridColumn/gridRow in served HTML)
- [x] ISC-65: Bio block shows display name, @handle, and bio
- [x] ISC-66: Links block renders the profile's external links
- [x] ISC-67: Gallery block renders stub placeholders noting Phase 2
- [x] ISC-68: Unknown handle returns 404
- [x] ISC-69: Public profile page title is the creator's display name (shareability)

### Phase 1 — follow
- [x] ISC-70: Follow button calls a server action inserting into `follows`
- [x] ISC-71: Unfollow action deletes the follow row
- [x] ISC-72: Follower count is displayed on the public profile
- [x] ISC-73: Anti: self-follow is impossible (server-action guard AND DB check constraint)
- [x] ISC-74: Anti: save path re-validates layout server-side — invalid JSON can never overwrite a stored layout
- [x] ISC-75: Antecedent: public profile view composes the same Window primitive as the rest of the facade
- [x] ISC-76: `bun run build` and `tsc --noEmit` still pass (regression)
- [x] ISC-77: All Phase-0 routes still return their Phase-0 status codes (regression)
- [DEFERRED-VERIFY] ISC-78: Live save + follow round-trip against a real Supabase project [follow-up: ATELIER-P1-LIVE — after ATELIER-P0-AUTH-LIVE creds exist, save a layout and follow a user against the real DB]

### Phase 2 — posts data model
- [x] ISC-79: Migration 0003 creates `posts` with a category check constraint limited to art/handmade/photography/music
- [x] ISC-80: `posts` has RLS enabled with public-select and own-row insert/delete policies
- [x] ISC-81: `media` storage bucket created public, with owner-folder-only write policy on storage.objects
- [x] ISC-82: Feed index exists on posts (author_id, created_at desc)
- [x] ISC-83: `POST_CATEGORIES` exports exactly the plan's four categories
- [x] ISC-84: `getFeedPosts` scopes to followed authors + self, ordered created_at descending
- [x] ISC-85: `getPostById` returns the post joined with author handle/display name
- [x] ISC-86: `getPostsByAuthor` returns an author's recent posts with a limit
- [x] ISC-87: ≥4 demo posts exist across ines/theo for preview mode

### Phase 2 — create-post flow
- [x] ISC-88: `/post/new` returns HTTP 200
- [x] ISC-89: Composer renders image file input (accept image/*), caption field, and a category select with the four categories
- [x] ISC-90: Client downscale caps the longest edge at 1600px; the fit math is pure and unit-tested
- [x] ISC-91: `createPost` uploads to the media bucket under a user-id folder and inserts the posts row
- [x] ISC-92: `createPost` re-validates category against the enum and caps caption length server-side
- [x] ISC-93: `/post/*` is auth-gated when configured (proxy matcher extended)
- [x] ISC-94: Preview mode composer renders a disabled state with a notice (200, no crash)
- [x] ISC-95: Successful create redirects to the new post's detail page

### Phase 2 — main feed
- [x] ISC-96: `/feed` renders posts as Window units with data-post markers
- [x] ISC-97: Feed is chronological — newest post appears first in served HTML
- [x] ISC-98: Each feed card links to the author's public profile
- [x] ISC-99: Each feed card links to the post detail page
- [x] ISC-100: Feed cards show category label and date
- [x] ISC-101: Follow-nobody state shows guidance instead of an empty void
- [x] ISC-102: A create-post entry point is visible on the feed

### Phase 2 — detail & gallery wiring
- [x] ISC-103: `/p/[id]` returns 200 rendering image, caption, author, and category
- [x] ISC-104: Unknown post id returns 404
- [x] ISC-105: Post detail page title includes the author's display name
- [x] ISC-106: `/u/ines` gallery block renders real (demo) post thumbnails linking to detail pages
- [x] ISC-107: Gallery block for an author with no posts still renders placeholders (no crash)

### Phase 2 — guards & regression
- [x] ISC-108: Anti: feed ordering uses created_at only — no score/weight/rank column or logic exists
- [x] ISC-109: Anti: sponsored/boost/promote/advertis grep across src still returns zero
- [x] ISC-110: Build, typecheck, lint, and full bun test suite all pass
- [x] ISC-111: All Phase 0/1 routes re-probed at their expected status codes
- [DEFERRED-VERIFY] ISC-112: Live create-post round-trip against real Supabase [follow-up: ATELIER-P2-LIVE — after creds exist: publish an image post, confirm storage object + feed row]
- [x] ISC-113: Antecedent: feed cards and post detail compose the Window primitive (facade consistency)

### Phase 3 — media pipeline (respect the work)
- [x] ISC-114: Migration 0004 adds `original_path`, `variants`, `blur_data`, `display` columns to posts
- [x] ISC-115: The original file is uploaded byte-for-byte untouched (no re-encode on the original path)
- [x] ISC-116: Original and variant upload paths are both rooted in the uploader's user-id folder (existing storage policy covers them)
- [x] ISC-117: `prepareUpload` produces the untouched original + multiple downscaled WebP variants + a blur placeholder
- [x] ISC-118: `variantWidthsFor` never upscales — pure and unit-tested
- [x] ISC-119: Uploads go client→storage directly; the server action receives only paths/metadata (1MB action-body limit respected)
- [x] ISC-120: `publishPost` rejects any path not rooted in the caller's own folder (ownership guard)
- [x] ISC-121: `publishPost` re-validates display config via `parseDisplay` and caps blur_data size server-side

### Phase 3 — display personalization (bold, not a toggle)
- [x] ISC-122: `display.ts` exports ≥3 frames, ≥3 spans, ≥4 aspect presets as typed enums
- [x] ISC-123: `parseDisplay` falls back to defaults on garbage input
- [x] ISC-124: span/aspect/frame class mappers are pure and unit-tested
- [x] ISC-125: Composer exposes frame, span, and aspect controls
- [x] ISC-126: Feed honors per-post span — wide/full posts span more columns in served HTML
- [x] ISC-127: Frame variants render distinct treatments (inset / full-bleed / plate) in served HTML
- [x] ISC-128: Aspect presets apply crop classes to the image
- [x] ISC-129: Demo posts exercise ≥3 distinct display configs (visible variety in preview feed)
- [x] ISC-130: Composer discloses that the original is preserved and display copies are optimized

### Phase 3 — responsive serving & performance
- [x] ISC-131: `ResponsiveImage` renders srcset with multiple widths and a sizes attribute
- [x] ISC-132: Blur-up placeholder renders as inline background until the image loads
- [x] ISC-133: Feed images are lazy with async decoding
- [x] ISC-134: Detail image loads eager with high fetch priority
- [x] ISC-135: Post detail offers a "View full resolution" link to the untouched original when present
- [x] ISC-136: Full bun test suite (≥32 tests) passes

### Phase 3 — guards & regression
- [x] ISC-137: Anti: no canvas/re-encode call ever touches the original file object
- [x] ISC-138: Anti: sponsored/boost/promote/advertis grep across src still zero
- [x] ISC-139: Build, typecheck, and lint all pass
- [x] ISC-140: All prior routes re-probed at expected status codes
- [DEFERRED-VERIFY] ISC-141: Live high-res upload round-trip [follow-up: ATELIER-P3-LIVE — after creds: upload a >10MB photo, confirm original object bytes identical + variants + blur + display config round-trip]
- [x] ISC-142: Antecedent: all personalization flows through the typed PostDisplay config — no ad-hoc per-post CSS

### Phase 4 — groups data model
- [x] ISC-143: Migration 0005 creates `groups` with name/slug constraints and an `is_private` feed-privacy flag
- [x] ISC-144: `group_members` has an owner/member role check and composite PK
- [x] ISC-145: `group_invites` and `group_join_requests` tables exist with composite PKs
- [x] ISC-146: `post_groups` join table links posts to groups (cascade deletes)
- [x] ISC-147: RLS enabled on all five new tables with policies
- [x] ISC-148: Member vs follower are structurally distinct (`group_members` vs `group_followers`)
- [x] ISC-149: group_members allows three insert paths: creator bootstrap, invited self-join, owner-approved requester

### Phase 4 — lib & demo
- [x] ISC-150: Group types export the viewer-relation enum (owner/member/follower/invited/requested/none)
- [x] ISC-151: ≥2 demo groups with members and tagged posts (one private) for preview mode
- [x] ISC-152: `getGroupsForPosts` maps post→groups in a single query (feed markers)
- [x] ISC-153: `getGroupPosts` returns a group's tagged posts chronologically

### Phase 4 — create, invite, join, follow
- [x] ISC-154: `/groups` lists groups with member/follower counts
- [x] ISC-155: Create-group form on `/groups` (name, description, privacy)
- [x] ISC-156: `createGroup` slugifies, inserts group + owner membership
- [x] ISC-157: Invite form is member-only; `inviteToGroup` validates inviter membership server-side
- [x] ISC-158: `acceptInvite` turns an invite into membership and removes the invite
- [x] ISC-159: `requestToJoin` + owner-guarded `approveRequest` actions exist
- [x] ISC-160: `followGroup`/`unfollowGroup` actions exist (follower can never tag)
- [x] ISC-161: Anti: publishing validates group membership server-side — a non-member can never tag a post into a group

### Phase 4 — group page & feed
- [x] ISC-162: `/g/[slug]` returns 200 with name, description, windowed layout (public route)
- [x] ISC-163: Group feed renders the posts tagged into that group
- [x] ISC-164: Unknown group slug returns 404
- [x] ISC-165: Member list renders with handles
- [x] ISC-166: Private group feed is hidden from non-members with a notice
- [x] ISC-167: Non-members see follow and request-to-join controls

### Phase 4 — cross-linking
- [x] ISC-168: Composer offers group-tagging checkboxes for the author's member groups
- [x] ISC-169: `publishPost` accepts group_ids and inserts post_groups rows
- [x] ISC-170: Main feed shows an "also in [group]" marker on tagged posts
- [x] ISC-171: The marker links to that group's feed at /g/[slug]

### Phase 4 — guards & regression
- [x] ISC-172: Build, typecheck, lint, and full test suite pass
- [x] ISC-173: All prior routes re-probed at expected status codes
- [DEFERRED-VERIFY] ISC-174: Live group round-trip (create→invite→join→tag→both feeds) [follow-up: ATELIER-P4-LIVE — after creds: run the full DoD sequence against real RLS]
- [x] ISC-175: Antecedent: group pages compose the Window primitive; Anti: promo grep still zero

### Phase 5 — chat data model
- [x] ISC-176: Migration 0006 creates `chat_threads` with participant normalization trigger
- [x] ISC-177: `chat_messages` table has thread_id FK, body check (1–2000), and created_at index
- [x] ISC-178: RLS on `chat_threads` and `chat_messages` — participants only
- [x] ISC-179: `chat_threads` unique index works bidirectionally (least/greatest)

### Phase 5 — lib & demo
- [x] ISC-180: Chat types export `ChatThread` and `ChatMessage`
- [x] ISC-181: ≥2 demo threads with messages for preview mode
- [x] ISC-182: `getChatThreads` returns threads with resolved other profile and last message
- [x] ISC-183: `getThreadMessages` returns full message list with resolved thread
- [x] ISC-184: `findThreadWithUser` reuses normalised-ordered lookup

### Phase 5 — actions & UI
- [x] ISC-185: `startOrGetThread` finds existing thread or creates one deterministically
- [x] ISC-186: `sendMessage` validates body length and delegates to RLS for participant guard
- [x] ISC-187: `/chat` lists conversation threads as Window units
- [x] ISC-188: `/chat/[id]` renders message history with input form
- [x] ISC-189: Empty message list shows guidance instead of a void
- [x] ISC-190: Messages display with sender differentiation (self vs other)

### Phase 5 — navigation & entry points
- [x] ISC-191: Nav includes a Chat tab linking to `/chat`
- [x] ISC-192: Proxy gates `/chat` routes behind auth
- [x] ISC-193: Message button appears on other users' public profile pages
- [x] ISC-194: Message button is hidden on own profile, preview mode, and signed-out

### Phase 5 — guards & regression
- [x] ISC-195: Build, typecheck, and lint pass (14 routes + proxy)
- [x] ISC-196: All prior routes re-probed at expected status codes
- [DEFERRED-VERIFY] ISC-197: Live chat round-trip (start thread → send message → receive in thread) [follow-up: ATELIER-P5-LIVE — after creds: two-auth-user send/receive test]
- [x] ISC-198: Anti: chat messages have no read-receipt or typing-indicator infrastructure (deferred patterns, not scope-crept)
- [x] ISC-199: Antecedent: chat pages compose the Window primitive; Anti: promo grep still zero

### Phase 6 — events data model
- [x] ISC-200: Migration 0007 creates `events` with title, starts_at, location_type (venue|online), and https ticket_url checks
- [x] ISC-201: `events` RLS: public select, owner-only insert/update/delete
- [x] ISC-202: Index on (profile_id, starts_at)

### Phase 6 — lib & demo
- [x] ISC-203: EventItem type exported with location_type union
- [x] ISC-204: `splitEvents(events, now)` is pure: upcoming ascending, past descending, boundary unit-tested
- [x] ISC-205: Fixed-locale event date+time formatter (no hydration drift)
- [x] ISC-206: Demo events: ines ≥2 upcoming + ≥1 past; theo none (empty state)

### Phase 6 — management (the musician's side)
- [x] ISC-207: `/profile/events` returns 200 (auth-gated via existing /profile matcher)
- [x] ISC-208: Create form: title, datetime, location type + text, description, ticket URL
- [x] ISC-209: `createEvent` validates title/date/URL server-side and inserts as the owner
- [x] ISC-210: `deleteEvent` removes only the caller's own event
- [x] ISC-211: Preview mode: form disabled with notice; demo events listed
- [x] ISC-212: Profile tab links to the events manager

### Phase 6 — public rendering
- [x] ISC-213: `/u/ines` events block lists upcoming events sorted by date ascending
- [x] ISC-214: Each upcoming event shows date, title, and location
- [x] ISC-215: Ticket CTA links out to the ticket_url (new tab, rel noopener)
- [x] ISC-216: Past events render collapsed (details element), not hidden entirely
- [x] ISC-217: No-events state renders a placeholder (theo)

### Phase 6 — guards & regression
- [x] ISC-218: Anti: zero ticketing/payment code in the events surface (link-out only, per plan)
- [x] ISC-219: Build, typecheck, tests (≥37), and lint pass
- [x] ISC-220: All prior routes incl. /chat re-probed at expected codes
- [DEFERRED-VERIFY] ISC-221: Live event round-trip [follow-up: ATELIER-P6-LIVE — after creds: add an event via the form, confirm row + public render + CTA]
- [x] ISC-222: Antecedent: events render inside the Window primitive via ProfileCanvas

### Phase 7 — donations data model
- [x] ISC-223: Migration 0008 creates `donations` with amount/currency/kind/status checks
- [x] ISC-224: `appeals` table with audience check, goal, active flag, created_by
- [x] ISC-225: `profiles.is_admin` column added (default false)
- [x] ISC-226: donations RLS: readable by own donor + admins; NO client insert policy (webhook/service-role only)
- [x] ISC-227: appeals RLS: active appeals publicly selectable; admin-only writes

### Phase 7 — Stripe integration
- [x] ISC-228: `stripe` dependency installed; client lazily created only when STRIPE_SECRET_KEY exists
- [x] ISC-229: Checkout supports one-off (mode=payment) AND recurring (mode=subscription)
- [x] ISC-230: Checkout carries appeal attribution in metadata
- [x] ISC-231: Webhook route verifies the Stripe signature before any processing
- [x] ISC-232: Webhook records the succeeded donation via a service-role Supabase client
- [x] ISC-233: Email receipts enabled through Checkout (customer email captured)
- [x] ISC-234: `.env.example` documents STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY

### Phase 7 — the donate surface
- [x] ISC-235: `/donate` returns 200 publicly (no auth gate)
- [x] ISC-236: Page explains honestly what donations fund
- [x] ISC-237: Amount presets + custom amount + one-off/monthly choice
- [x] ISC-238: Preview mode: donate action disabled with notice (200, no crash)
- [x] ISC-239: Shell footer links to /donate

### Phase 7 — admin appeals (deliberately manual)
- [x] ISC-240: `/admin/appeals` behind proxy matcher AND server-side is_admin check
- [x] ISC-241: Non-admin request yields 404 (existence not leaked)
- [x] ISC-242: Create-appeal form: title, message, goal, audience (everyone/past donors/active users), active
- [x] ISC-243: `toggleAppeal` switches an appeal on/off
- [x] ISC-244: Per-appeal results: raised sum, reach estimate, progress vs goal
- [x] ISC-245: Demo appeal + demo ledger render in preview mode

### Phase 7 — in-app banner channel
- [x] ISC-246: Active appeal renders as a single shell banner (in-app notification channel)
- [x] ISC-247: Banner links to /donate carrying appeal attribution
- [x] ISC-248: Banner is dismissible; dismissal persists client-side per appeal
- [x] ISC-249: No active appeal → no banner rendered
- [x] ISC-250: Banner shows goal progress when the appeal has a goal

### Phase 7 — guards & regression
- [x] ISC-251: Anti: donations grant zero feed/rank/visibility effect (no donation reference in feed/post/group queries)
- [x] ISC-252: Anti: no nag walls — at most one banner, dismissible, never a modal
- [x] ISC-253: Build, typecheck, tests, lint pass
- [x] ISC-254: All prior routes re-probed at expected codes
- [DEFERRED-VERIFY] ISC-255: Live Stripe donation round-trip incl. receipt [follow-up: ATELIER-P7-LIVE — needs Stripe test keys + Supabase creds: donate, verify webhook row + receipt email + ledger]
- [x] ISC-256: Antecedent: donation surfaces compose the Window primitive

### Phase 8 — jobs data model
- [ ] ISC-257: Migration 0009 creates `job_posts` with discipline/work_mode/status/apply_url checks
- [ ] ISC-258: job_posts RLS: public select, owner-only insert/update/delete
- [ ] ISC-259: Indexes for discovery (status, created_at desc) and per-profile listing

### Phase 8 — lib, demo & layout block
- [ ] ISC-260: Types export ≥5 disciplines, 3 work modes (remote/on_site/hybrid), 3 statuses
- [ ] ISC-261: `filterJobs` is pure (discipline + work mode) and unit-tested
- [ ] ISC-262: ≥3 demo jobs including one filled (collapse/discovery-exclusion test)
- [ ] ISC-263: Layout engine gains the `jobs` block type; full test suite still passes

### Phase 8 — poster management
- [ ] ISC-264: `/profile/jobs` returns 200 (gated via /profile matcher)
- [ ] ISC-265: Create form: title, discipline, description, location, work mode, compensation, apply link
- [ ] ISC-266: `createJob` re-validates title/discipline/URL server-side
- [ ] ISC-267: `setJobStatus` cycles open/filled/closed on own rows only
- [ ] ISC-268: Preview mode: form disabled with notice; demo jobs listed
- [ ] ISC-269: Profile tab links to the jobs manager

### Phase 8 — profile block & discovery
- [ ] ISC-270: Jobs window block renders open postings on public profiles
- [ ] ISC-271: Filled/closed postings collapse in a details element
- [ ] ISC-272: Block links to the discovery view
- [ ] ISC-273: `/jobs` returns 200 publicly
- [ ] ISC-274: Discovery lists open jobs newest-first (created_at only)
- [ ] ISC-275: Discipline filter works via query param (probed in served HTML)
- [ ] ISC-276: Work-mode filter works via query param
- [ ] ISC-277: Filled/closed jobs never appear in discovery
- [ ] ISC-278: Each listing links to the poster's profile
- [ ] ISC-279: Apply flow: chat thread via MessageButton, or external link when apply_url exists
- [ ] ISC-280: Compensation renders ("range or negotiable" — free text)

### Phase 8 — guards & regression
- [ ] ISC-281: Anti: no paid placement — discovery has no ordering beyond created_at
- [ ] ISC-282: Anti: no promotional mechanism exists — every sponsored/boost/promote/advertis match in src/ is negation copy stating the principle, never a code path or surface [refined 2026-07-09, see Decisions]
- [ ] ISC-283: Build, typecheck, tests, lint pass
- [ ] ISC-284: All prior routes re-probed at expected codes
- [ ] ISC-285: Live job round-trip (post→discover→apply→filled) [DEFERRED-VERIFY — follow-up: ATELIER-P8-LIVE]
- [ ] ISC-286: Antecedent: jobs surfaces compose the Window primitive

## Test Strategy

| isc | type | check | threshold | tool |
|---|---|---|---|---|
| 1 | repo | git log has ≥1 commit | exit 0 | Bash |
| 2–3, 6 | file | scaffold files exist / contain markers | present | Read/Grep |
| 4–5 | build | build + typecheck | exit 0 | Bash |
| 7–10 | tokens | grep custom properties / font / scale | match | Grep |
| 11–15 | component | files export symbols; HTML shows window markup | match | Grep/curl |
| 16 | docs | DESIGN.md sections present | present | Read |
| 17–23, 25, 32 | http | curl running dev server | 200 + markup | Bash curl |
| 24, 26–31 | code | grep API calls / env keys | match | Grep/Read |
| 33 | live | deferred — real Supabase creds | round-trip | follow-up |
| 34–38 | sql/docs | read migration/seed/README content | match | Read/Grep |
| 39–41 | anti | negative greps / file absence | zero matches | Bash/Grep |
| 42 | antecedent | tab pages import Window | 3/3 | Grep |

## Features

| name | description | satisfies | depends_on | parallelizable |
|---|---|---|---|---|
| scaffold | git init + create-next-app (TS, Tailwind, bun) | ISC-1..6, 39 | — | no |
| design-tokens | Bauhaus palette, font, type scale, spacing | ISC-7..10, 41 | scaffold | no |
| window-primitive | Window, grid, motion presets | ISC-11..15, 42 | design-tokens | no |
| app-shell | three-tab nav + empty states | ISC-18..23 | window-primitive | yes |
| auth | Supabase ssr clients, login, callback, middleware, env example | ISC-24..33 | scaffold | yes |
| db-workflow | migrations, seed, README docs | ISC-34..38 | scaffold | yes |
| styleguide-docs | DESIGN.md + /design route | ISC-16..17 | window-primitive | yes |
| p1-data-model | migration 0002: links column, follows table + RLS | ISC-43..45 | db-workflow | yes |
| p1-layout-engine | pure-TS grid engine (move/resize/collide/compact) + bun tests | ISC-46..52 | scaffold | yes |
| p1-editor | drag/resize canvas, palette, identity form, save action | ISC-53..62, 74 | p1-layout-engine, auth | no |
| p1-public-view | /u/[handle] SSR renderer + demo profiles | ISC-63..69, 75 | p1-layout-engine | yes |
| p1-follow | follow/unfollow actions + button + count | ISC-70..73 | p1-data-model | yes |
| p2-data-model | migration 0003: posts table, storage bucket + policies | ISC-79..82 | p1-data-model | yes |
| p2-post-lib | types, demo posts, queries, downscale math + tests | ISC-83..87, 90 | p2-data-model | yes |
| p2-composer | /post/new upload flow + createPost action + gating | ISC-88..95 | p2-post-lib, auth | no |
| p2-feed | chronological windowed feed + entry point | ISC-96..102, 108 | p2-post-lib | yes |
| p2-detail-gallery | /p/[id] + profile gallery wiring | ISC-103..107 | p2-post-lib | yes |
| p3-migration | 0004: original_path, variants, blur_data, display | ISC-114 | p2-data-model | yes |
| p3-media-lib | prepareUpload, variant math, blur + tests | ISC-115..118, 137 | p2-post-lib | yes |
| p3-display-lib | PostDisplay enums, parse, class mappers + tests | ISC-122..124, 142 | p2-post-lib | yes |
| p3-publish | client-direct upload + publishPost ownership guards | ISC-119..121, 125, 130 | p3-media-lib, p3-display-lib | no |
| p3-rendering | ResponsiveImage, blur-up, frames/spans/aspects in feed+detail | ISC-126..129, 131..135 | p3-display-lib | yes |
| p4-data-model | migration 0005: groups, members, followers, invites, requests, post_groups | ISC-143..149 | p2-data-model | yes |
| p4-groups-lib | types, demo groups, queries incl. post→groups map | ISC-150..153 | p4-data-model | yes |
| p4-actions | create/invite/accept/request/approve/follow actions | ISC-156..161 | p4-groups-lib | no |
| p4-pages | /groups tab + /g/[slug] group page + feed | ISC-154..155, 162..167 | p4-actions | yes |
| p4-crosslink | composer tagging + publishPost groups + feed markers | ISC-168..171 | p4-actions | yes |
| p5-data-model | migration 0006: chat_threads (normalized PK) + chat_messages + RLS | ISC-176..181 | scaffold | yes |
| p5-chat-lib | types, demo threads/messages, queries incl. thread resolution | ISC-182..184 | p5-data-model | yes |
| p5-actions | startOrGetThread, sendMessage (RLS-enforced) + redirect | ISC-185..186 | p5-chat-lib | no |
| p5-pages | /chat list + /chat/[id] thread with optimistic send | ISC-187..190 | p5-actions | yes |
| p5-nav-profile | Chat nav tab + message button on public profiles | ISC-191..193 | p5-actions | yes |

## Decisions

- 2026-07-08 15:12 — Delegation floor (E3 ≥2) relaxed, show-your-math: `codex` CLI absent so Forge cannot run; remaining candidates are Claude-family subagents on a fresh scaffold whose files are tightly interdependent (tokens → primitive → shell) — handoff/merge overhead exceeds the ~10min tier budget benefit. Single-author this run; revisit delegation from Phase 1 when the codebase has parallelizable seams.
- 2026-07-08 15:12 — EnterPlanMode skipped despite E3: session is non-interactive and the user's instruction is an explicit execution order ("build!"); plan-mode approval would deadlock the run.
- 2026-07-08 15:12 — App scaffolded into `atelier/` subdir (create-next-app needs an empty dir; plan + ISA stay at repo root).
- 2026-07-08 15:12 — Supabase CLI + credentials absent: migrations ship as plain SQL under `supabase/migrations/`; live auth is ISC-33 DEFERRED-VERIFY with follow-up ATELIER-P0-AUTH-LIVE.
- 2026-07-08 15:12 — mode-detection.md load skipped: plain build request, no ideate/optimize/research signal; noted per Bitter Pill (ceremony must not eat the E3 budget).
- 2026-07-08 15:32 — Next 16 renamed `middleware.ts` → `proxy.ts` (confirmed in bundled docs); auth gating implemented as `src/proxy.ts` exporting `proxy()`.
- 2026-07-08 15:34 — Port 3000 occupied by a pre-existing bun process (pid 38041, not ours); Atelier verification server runs on :3100 instead.
- 2026-07-08 15:38 — refined: feed copy "No promoted posts" reworded to "Nothing pays for reach" so the ISC-40 anti-grep stays binary-clean; ISC-39 evidence scoped to git-tracked files (a `yarn.lock` inside a third-party node_modules package is not our package management).

- 2026-07-08 15:42 — Rule 2 advisor call attempted and failed: `claude` executable not on PATH in this WSL environment (same root cause as the classifier fail-safe). No conflicting empirical signal existed, so Rule 3 did not fire. Environment fix (install/expose `claude` CLI) would restore advisor + classifier for future runs.
- 2026-07-08 16:05 — Phase 1: delegation floor (E3 ≥2) relaxed again, show-your-math: environment unchanged (no codex), and the layout schema defined this run is the dependency of every other Phase 1 file — parallel agents would have serialized on it. Advisor not re-attempted: binary still absent (verified this session); retry would add latency with zero new information.
- 2026-07-08 16:05 — Custom pure-TS grid engine chosen over react-grid-layout: react-draggable depends on findDOMNode, removed in React 19 — dependency risk traded for ~150 unit-tested lines.
- 2026-07-08 16:05 — Next 16 eslint (React Compiler rules) rejected sync setState in effect and self-referencing listener cleanup; fixed with deferred localStorage restore and AbortController-scoped drag listeners. Pattern worth reusing in later phases.
- 2026-07-08 16:25 — Phase 2: delegation floor relaxed (same math: no codex; post schema single-sourced this run). Advisor still unavailable (binary absent). Plain `<img>` chosen over next/image: the media pipeline (responsive sizes, blur-up, remote patterns) is explicitly Phase 3's deliverable — premature config now would be churn.
- 2026-07-08 16:25 — Client-side canvas downscale (WebP 0.85, ≤1600px) instead of server-side image processing: no server image lib in the stack, and Phase 3 moves optimization to a CDN anyway. Pure fitWithin math extracted for headless testing.
- 2026-07-08 17:00 — Phase 3: uploads restructured client→storage direct after verifying Next's 1MB server-action body limit — originals can never ship through actions. publishPost gained the own-folder path guard as a consequence (client-supplied paths are untrusted input).
- 2026-07-08 17:00 — Variant generation kept in-app (no CDN account exists); migration 0004 documents the CDN swap point as a URL change, not a schema change. Delegation floor relaxed (same math as prior phases); advisor binary still absent.
- 2026-07-08 17:40 — Phase 4: private-group feed privacy enforced at the page query (posts/post_groups selects stay public because the main feed needs them). Full column-level RLS depth for private-group content is logged as Phase 9 trust-&-safety hardening — the current gate hides content in every rendered surface but a direct API reader with the anon key could enumerate post_groups rows of private groups (post rows themselves were already public by design).
- 2026-07-08 17:40 — Member vs follower modeled as separate tables rather than a role column: the "followers can't tag" rule then falls out of the post_groups RLS policy referencing group_members only — impossible to bypass by flipping a role value.
- 2026-07-09 12:00 — Phase 5 chat: thread uniqueness enforced by a `least/greatest` unique index rather than a trigger-normalized PK, because Supabase's RLS policies reference raw columns — a normalized PK would have needed the trigger to be security_definer and the index approach is simpler to reason about. The normalization trigger still runs to keep A/B ordered in the row.
- 2026-07-09 12:00 — Chat messages use server-action form posts (no Supabase Realtime subscription) for Phase 5: real-time delivery adds subscription setup, channel auth, and reconnection logic that belongs in a follow-up pass. Messages appear optimistically via `useOptimistic` so the UX feels instant.
- 2026-07-09 (audit) — Phase 5 absorbed from a second agent and independently re-verified: build/tsc/35 tests/lint green, /chat routes + 404 probed, message button correctly hidden in preview, all prior routes regression-clean, migration RLS + least/greatest uniqueness confirmed. Bookkeeping corrected: progress was marked 199/199 despite 6 open DEFERRED-VERIFY criteria → 193/199.
- 2026-07-09 (audit) — Phase 5 scope gap vs the build plan's DoD, surfaced for the principal: Realtime delivery, image sharing in threads, and delivery/read state were deferred by the building agent (documented above). Chat works as form-post DMs with optimistic UI. Backlog item ATELIER-P5.1 (realtime + image share + read state) — slot before or with Phase 9 polish.
- 2026-07-09 — Phase 6: follower event reminders (plan-optional) skipped — needs email infra that arrives with Phase 7's Resend integration; noted as a cheap add-on then. Events store timestamptz and render fixed en-GB UTC-labeled to avoid SSR hydration drift; local-timezone rendering is a Phase 9 polish candidate.
- 2026-07-09 — Phase 7: appeal EMAIL channel not implemented (no Resend key, no recipient-list infra); the in-app banner channel is complete. Plan says "banner and/or email" — banner satisfies the disjunction; email + event reminders bundle into one Resend pass (backlog ATELIER-EMAIL). Donation receipts ride Stripe Checkout's own receipt emails, so receipts are NOT blocked on Resend.
- 2026-07-09 — refined: AppealBanner refactored from client-state visibility to cookie-based server rendering after the curl probe caught that the banner never existed in SSR HTML (unverifiable + hydration flash). Verification pressure improved the design — dismissal now survives without JS.
- 2026-07-09 — Donations table deliberately has NO client insert policy: the Stripe webhook (service role) is the only writer, making forged donations impossible from the anon key. Admin gate returns 404 (not 403) so the surface isn't enumerable.
- 2026-07-09 12:00 — Message button implemented as a client component calling a server action (`startOrGetThread`) instead of a plain form action, so clicking it navigates client-side without a page reload. The form-action variant (`startChatAndRedirect`) exists as a fallback for non-JS contexts.
- 2026-07-09 12:00 — Chat nav tab added as a fourth entry in the existing TABS array rather than as a sub-nav or sidebar, keeping the Bauhaus facade pattern consistent. The accent color repeats yellow (shared with Profile) — each phase adds surface area and the five-token palette limits distinct accent allocation.

## Changelog

- **conjectured:** The profile editor would use an off-the-shelf drag-resize engine (react-grid-layout, as the build plan suggested).
  **refuted by:** React 19 removed `findDOMNode`, which react-draggable (react-grid-layout's drag core) depends on; Next 16's React-Compiler eslint rules additionally reject the listener patterns such libraries rely on.
  **learned:** On a bleeding-edge stack, a small pure-function engine you can unit-test beats a mature dependency you can't run — the ~150-line custom engine made drag behavior verifiable headlessly, which no library would have given us.
  **criterion now:** ISC-50/51/52 pin collision push-down, compaction idempotence, and the 17-test suite; ISC-55/56 wire the DOM to that tested math.

- **conjectured:** Next.js auth-gating middleware lives in `middleware.ts`, as in every prior Next version.
  **refuted by:** Next 16 bundled docs (`node_modules/next/dist/docs/.../proxy.md`) — the `middleware` file convention is deprecated and renamed to `proxy`.
  **learned:** This scaffold's AGENTS.md warning is real: always read the bundled Next 16 docs before writing convention files; training-data conventions may 404 silently.
  **criterion now:** ISC-30 verified via `src/proxy.ts` exporting `proxy()` with matcher gating /feed, /groups, /profile, /login.

## Verification

- ISC-1: Bash — `git log --oneline` → `378c2a7 Atelier Phase 0: foundation, Bauhaus design system, auth shell` (41 files tracked)
- ISC-2: Read — `atelier/tsconfig.json` + `src/app/` App Router tree present (create-next-app 16.2.10, --ts)
- ISC-3: Grep — `globals.css` line 1: `@import "tailwindcss"` (Tailwind v4 + @theme tokens)
- ISC-4: Bash — `bun run build` exit 0; route manifest lists /, /auth/callback, /design, /feed, /groups, /login, /profile + `ƒ Proxy (Middleware)`
- ISC-5: Bash — `bunx tsc --noEmit` → `TSC_OK`; `bun run lint` clean
- ISC-6: Bash — `bun.lock` present in atelier/
- ISC-7: Grep — `--color-ink/--color-paper/--color-red/--color-blue/--color-yellow` defined in `@theme`
- ISC-8: Grep — `Space_Grotesk` in layout.tsx (×2: import + init), `--font-grotesk` wired to `--font-sans`, `font-sans` on body
- ISC-9: Grep — `--text-display/h1/h2/body/caption` with line-height/tracking modifiers in `@theme`
- ISC-10: Grep — `--spacing-unit: 8px` in `@theme` + `--unit: 8px` in `:root`
- ISC-11: Read — `src/components/ui/Window.tsx` exports `Window` (+ `WindowProps`, `WindowAccent`)
- ISC-12: curl — served /feed HTML contains 2× `data-window` and 2× `data-accent` header squares
- ISC-13: Read — `accent?: WindowAccent` with `WindowAccent = "red" | "blue" | "yellow"`, mapped via `ACCENT_BG`
- ISC-14: Read — `src/lib/design/motion.ts` exports `windowIn`, `windowOut`, `facadeStagger` (framer-motion Variants)
- ISC-15: Grep — `WindowGrid` (`grid-cols-12`) imported by feed, groups, profile, design pages (4/4)
- ISC-16: Read — `atelier/DESIGN.md` documents palette table, type scale, 8px grid, Window usage + rules
- ISC-17: curl — GET /design → 200, HTML contains 5× `data-window` (swatches, scale, 3 window demos)
- ISC-18: curl — GET /feed → 200 (preview mode, :3100)
- ISC-19: curl — GET /groups → 200
- ISC-20: curl — GET /profile → 200
- ISC-21: curl — /feed HTML contains nav links >Feed< >Groups< >Profile<
- ISC-22: curl — GET / → 307 with `redirect_url=http://localhost:3100/feed`
- ISC-23: curl — every tab page serves `data-grid` + `data-window` composition
- ISC-24: Grep — `createBrowserClient` in lib/supabase/client.ts, `createServerClient` in lib/supabase/server.ts (both @supabase/ssr)
- ISC-25: curl — with Supabase env set (:3101 dummy-env instance): /login → 200 with `type="email"` input, "Send magic link" and "Continue with Google" buttons
- ISC-26: Grep — `signInWithOtp` in login/actions.ts with `emailRedirectTo` → /auth/callback
- ISC-27: Grep — `signInWithOAuth({ provider: "google" ... })` in login/actions.ts
- ISC-28: Grep — `exchangeCodeForSession` in auth/callback/route.ts
- ISC-29: Grep — `auth.signOut` in login/actions.ts `signOut` action
- ISC-30: curl — dummy-env instance: GET /feed → 307 redirect to /login (proxy.ts gating live); build manifest shows `ƒ Proxy (Middleware)`
- ISC-31: Grep — `.env.example` contains both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ISC-32: curl — no-env instance (:3100): /login → 200 with `data-setup-notice`, shell tabs 200 with preview banner, zero crashes
- ISC-33: DEFERRED — no Supabase project credentials in this environment; follow-up ATELIER-P0-AUTH-LIVE
- ISC-34: Read — migration creates `public.profiles` with `references auth.users (id) on delete cascade`
- ISC-35: Grep — `enable row level security` + 3 policies (public select, own insert, own update)
- ISC-36: Grep — `create trigger on_auth_user_created after insert on auth.users` → `handle_new_user()`
- ISC-37: Read — `supabase/seed.sql` seeds 2 demo users + profile handles/bios
- ISC-38: Grep — README contains `supabase db reset` and `supabase db push` workflow + numbering convention
- ISC-39: Bash — no `package-lock.json`/`yarn.lock` in git-tracked files (only bun.lock)
- ISC-40: Grep — `sponsored|boost|promote|advertis` in src/ → 0 matches after copy refinement
- ISC-41: Grep — `green|purple|orange|pink|teal|violet` in globals.css → 0 matches
- ISC-42: Grep — feed, groups, profile (and design) all import `@/components/ui/Window` (4/4)

### Phase 1 (verified 2026-07-08, commit 3bab0d4)
- ISC-43..45: Grep — migration 0002 contains `add column links jsonb`, `create table public.follows` (composite PK), `no_self_follow` check, `enable row level security` + 3 policies
- ISC-46..51: Read/Bash — layout.ts exports types/DEFAULT_LAYOUT; behavior pinned by unit tests (clamp, min sizes, collision push-down, compaction idempotence, parse fallback)
- ISC-52: Bash — `bun test`: 17 pass / 0 fail, 31 assertions
- ISC-53: curl — GET /profile/edit → 200
- ISC-54: curl — editor HTML has `data-editor-canvas` + `data-block` for bio/links/gallery
- ISC-55/56: Grep — title-bar `onPointerDown → beginDrag(move)` and corner `beginDrag(resize)` wired to moveBlock/resizeBlock grid-snap math (math itself unit-tested)
- ISC-57: curl — palette renders `data-palette="posts"`, `data-palette="events"` (the two types not on the default canvas)
- ISC-58: Read — per-block × button calls `removeBlock`
- ISC-59: Grep — `saveProfile` server action updates `profiles` (display_name, handle, bio, links, layout)
- ISC-60: Grep — preview path writes `localStorage` PREVIEW_KEY + status notice; /profile/edit serves 200 with no env
- ISC-61: curl — inputs `#display_name`, `#handle`, `#bio` + links rows present in editor HTML
- ISC-62: Read — /profile/edit sits under the `/profile/:path*` proxy matcher (gating verified in Phase 0 with dummy env)
- ISC-63: curl — GET /u/ines → 200 server-rendered (preview demo)
- ISC-64: curl — served HTML places blocks per ines's CUSTOM layout: `grid-column:1 / span 5` (bio), `6 / span 7` (gallery), `1 / span 12` (events) — not the default
- ISC-65: curl — bio block shows "Inês Almeida", `@ines`, bio text
- ISC-66: curl — links block renders "Darkroom notes" external link
- ISC-67: curl — gallery stub renders "posts arrive in phase 2" note
- ISC-68: curl — GET /u/nobody-here → 404
- ISC-69: curl — `<title>Inês Almeida — Atelier</title>`
- ISC-70/71: Grep — follow inserts `{ follower_id, followee_id }`, unfollow deletes by both ids
- ISC-72: curl — `data-follower-count` renders "128 followers"
- ISC-73: Grep — `user.id === targetId` guard in action + `no_self_follow` DB constraint (defense in depth)
- ISC-74: Grep — `parseLayout(input.layout)` re-validates server-side before update; unit tests prove garbage → DEFAULT_LAYOUT
- ISC-75: Read — ProfileCanvas composes `@/components/ui/Window` for every block
- ISC-76: Bash — `bun run build` exit 0 (10 routes + proxy), `tsc --noEmit` TSC_OK, eslint clean
- ISC-77: curl — Phase-0 routes re-probed: / 307, feed/groups/profile/design/login all 200
- ISC-78: DEFERRED — no Supabase credentials; follow-up ATELIER-P1-LIVE

### Phase 2 (verified 2026-07-08, commit 73e56b1)
- ISC-79..82: Grep — migration 0003: category check (art/handmade/photography/music), RLS + 3 policies, media bucket + storage.foldername owner-folder policies, posts_author_created_idx
- ISC-83: Read — POST_CATEGORIES = ["art","handmade","photography","music"] as const
- ISC-84: Grep — getFeedPosts: followee_id subselect + own id, `.order("created_at", { ascending: false })`
- ISC-85/86: Read — getPostById/getPostsByAuthor join `author:profiles(handle, display_name)` with limit
- ISC-87: Read — 5 demo posts (3 ines, 2 theo) with local SVG media
- ISC-88: curl — GET /post/new → 200
- ISC-89: curl — composer HTML: `accept="image/*"` input, #caption, category select (4 categories + placeholder)
- ISC-90: Bash — fitWithin unit tests: 7 pass (landscape/portrait/square/aspect/zero cases); downscaleImage caps at MAX_DISPLAY_EDGE=1600
- ISC-91: Grep — `.upload(path, image, ...)` to media bucket, path = `${user.id}/${uuid}.{ext}`, then posts insert
- ISC-92: Grep — isPostCategory(category) + caption `.slice(0, 1000)` + type/size checks server-side
- ISC-93: Grep — proxy matcher includes "/post/:path*", PROTECTED includes "/post"
- ISC-94: curl — /post/new in preview: 200 with data-setup-notice, publish button disabled state
- ISC-95: Grep — `redirect(\`/p/${data.id}\`)` after successful insert
- ISC-96: curl — /feed serves 5 data-post windows (data-window ×5)
- ISC-97: curl — served order: theo-1 (Jul 7) → ines-1 (Jul 6) → ines-2 (Jul 3) → theo-2 (Jul 1) → ines-3 (Jun 28) — strictly chronological
- ISC-98/99: curl — cards link href="/u/ines|/u/theo" and 5× href="/p/demo-*"
- ISC-100: curl — category labels + fixed-locale dates ("07 Jul 2026") rendered
- ISC-101: Read — empty-feed branch renders follow guidance windows
- ISC-102: curl — data-new-post button → /post/new on feed header
- ISC-103: curl — /p/demo-ines-1 → 200 with image, caption, author, category dl
- ISC-104: curl — /p/nope → 404
- ISC-105: curl — `<title>Inês Almeida: Fira, morning…— Atelier</title>`
- ISC-106: curl — /u/ines gallery renders data-gallery-post thumbs for her 3 demo posts linking to /p/[id]
- ISC-107: Read — gallery/posts blocks render placeholder branch when posts.length === 0
- ISC-108: Grep — only ordering in queries.ts is created_at; sole rank/score/weight match is the comment stating the principle
- ISC-109: Grep — sponsored|boost|promote|advertis across src → 0
- ISC-110: Bash — build (12 routes + proxy), TSC_OK, 24 tests pass, eslint clean
- ISC-111: curl — all Phase 0/1 routes re-probed at expected codes (/, tabs, design, login, edit, /u/*)
- ISC-112: DEFERRED — no Supabase creds; follow-up ATELIER-P2-LIVE
- ISC-113: curl — feed cards and detail compose Window (data-window present on both surfaces)

### Phase 3 (verified 2026-07-08, commit 0a43646)
- ISC-114: Read — migration 0004 adds original_path, variants, blur_data (≤6000 check), display
- ISC-115/137: Grep — media.ts returns `original: file` untouched; canvas only draws the decoded bitmap copy; composer uploads `prepared.original` as-is with its own contentType
- ISC-116: Grep — originalPath=`${user.id}/originals/…`, variants=`${user.id}/display/…` — both inside the owner folder covered by 0003's storage policies
- ISC-117: Read — prepareUpload → untouched original + WebP variants + data-URI blur
- ISC-118: Bash — variantWidthsFor unit tests: 4 pass (typical/no-upscale/tiny/zero)
- ISC-119: Grep — composer calls supabase.storage.upload ×2 client-side; actions.ts contains no File/formData handling
- ISC-120: Grep — `paths.some(p => !p.startsWith(ownFolder) || p.includes(".."))` rejects foreign/traversal paths
- ISC-121: Grep — parseDisplay(input.display) + blur `data:image/` prefix check + slice(0, 6000)
- ISC-122: Bash — display.test: FRAMES ≥3, SPANS ≥3, ASPECTS ≥4 asserted
- ISC-123/124: Bash — parseDisplay fallback + span/aspect/frame mapper tests pass (distinctness asserted)
- ISC-125: curl — composer HTML: 3 data-frame-option, 3 data-span-option, 4 data-aspect-option buttons
- ISC-126: curl — feed spans: 1 full, 1 wide, 3 standard (col-span driven by config)
- ISC-127: curl — frames render distinctly: data-frame inset/full-bleed/plate; plate's `bg-ink p-6` mat present
- ISC-128: curl — aspect classes in served HTML: aspect-[3/2] ×4, aspect-square ×2
- ISC-129: curl — demo feed exercises 3 frames × 3 spans × 3 aspects simultaneously
- ISC-130: curl — data-pipeline-note: "original is stored untouched… display copies generated"
- ISC-131: curl — img tag carries srcSet="…480w, …800w" + sizes (camelCase in SSR stream; HTML attrs case-insensitive)
- ISC-132: curl — style="background-image:url(data:image/svg…);background-size:cover" blur-up present
- ISC-133: curl — loading="lazy" ×5 + decoding="async" ×5 in feed
- ISC-134: curl — detail img: loading="eager" + fetchPriority="high"
- ISC-135: curl — data-full-resolution link → untouched original on /p/demo-ines-1
- ISC-136: Bash — bun test: 35 pass / 0 fail across 4 suites
- ISC-138: Grep — promo grep across src → 0
- ISC-139: Bash — build (12 routes + proxy), TSC_OK, eslint clean
- ISC-140: curl — /, feed, profile, design, login, edit, /u/ines, /post/new, /p/* all at expected codes
- ISC-141: DEFERRED — no Supabase creds; follow-up ATELIER-P3-LIVE
- ISC-142: Grep — PostCard/detail read span/frame/aspect exclusively via display.ts mappers; no per-post CSS anywhere

### Phase 4 (verified 2026-07-08, commit 0e1baae)
- ISC-143..146: Grep — migration 0005: is_private flag, owner/member role check, invites + join_requests + post_groups tables (composite PKs, cascades)
- ISC-147: Grep — `enable row level security` ×6 (all new tables) with select/insert/delete policies
- ISC-148: Read — group_members and group_followers are separate tables; post_groups insert policy requires MEMBERSHIP, structurally excluding followers
- ISC-149: Grep — exactly 3 named membership insert policies: creator bootstrap / invited self-join / owner-admits-requester
- ISC-150: Read — GroupRelation = owner|member|follower|invited|requested|none
- ISC-151: Read — 2 demo groups (analogue-circle public, clay-wood private) with members + tagged posts
- ISC-152: Read — getGroupsForPosts: single `.in("post_id", ids)` query with groups join
- ISC-153: Read — getGroupPosts → getPostsByIds ordered created_at desc
- ISC-154: curl — /groups renders both cards with "3 members · 23 followers" style counts
- ISC-155: curl — data-create-group form with name/description/is_private
- ISC-156: Read — createGroup: slugifyGroupName + group insert + owner membership bootstrap
- ISC-157: curl/Read — invite Window renders form only for members; inviteToGroup checks inviter membership before insert
- ISC-158: Read — acceptInvite inserts membership then deletes the invite row
- ISC-159: Read — requestToJoin (self) + approveRequest (owner-guarded, deletes request after admit)
- ISC-160: Read — followGroup/unfollowGroup manage group_followers only — no tagging power
- ISC-161: Grep — publishPost: membership count must equal requested group_ids ("only tag groups you're a member of"); post_groups RLS re-checks
- ISC-162: curl — /g/analogue-circle → 200, 5 windows, name + description
- ISC-163: curl — group feed shows data-post demo-ines-1 + demo-ines-2 (the tagged posts)
- ISC-164: curl — /g/nope → 404
- ISC-165: curl — member list renders @ines (owner), @theo, @you with roles
- ISC-166: curl — clay-wood (private, viewer=none): data-private-notice present, 0 data-post elements leaked
- ISC-167: curl — data-follow-group + data-request-join both render for relation=none
- ISC-168: curl — composer data-group-tagging fieldset with Analogue Circle checkbox (preview member)
- ISC-169: Grep — publishPost inserts post_groups rows for validated groupIds
- ISC-170: curl — feed shows data-also-in ×3 (analogue-circle ×2, clay-wood ×1)
- ISC-171: curl — markers are links href="/g/analogue-circle" / "/g/clay-wood"
- ISC-172: Bash — build (13 routes + proxy), TSC_OK, 35 tests, eslint clean
- ISC-173: curl — /feed /post/new /u/ines /p/demo-ines-1 + all priors at expected codes
- ISC-174: DEFERRED — no Supabase creds; follow-up ATELIER-P4-LIVE
- ISC-175: curl/Grep — group pages compose Window (5 windows on /g/*); promo grep → 0

### Phase 5 (verified 2026-07-09, commit — pending)
- ISC-176: Read — migration 0006 creates chat_threads (participant_a/b, normalization trigger) + chat_messages (body 1–2000 check) + unique index on least/greatest
- ISC-177: Read — chat_messages has thread_id FK with cascade delete, body text check, created_at index on (thread_id, created_at)
- ISC-178: Grep — `enable row level security` ×2 (chat_threads, chat_messages); policies restrict select/insert to participants
- ISC-179: Read — unique index `chat_threads_participants_uniq` on `least(participant_a, participant_b), greatest(participant_a, participant_b)`
- ISC-180: Read — ChatThread (with other_id/other_handle/other_name/last_message) and ChatMessage exported from types.ts
- ISC-181: Read — 2 demo threads (ines, theo) with 3+ messages each for preview
- ISC-182: Read — getChatThreads resolves other profile, last message via per-thread query
- ISC-183: Read — getThreadMessages returns full ordered list with resolved thread metadata
- ISC-184: Read — findThreadWithUser uses normalized A/B ordering
- ISC-185: Read — startOrGetThread finds existing via normalized lookup or inserts + returns thread_id
- ISC-186: Grep — sendMessage validates `body.length` (via trim + slice(0,2000)); RLS enforces participant gate DB-side
- ISC-187: curl — /chat → 200 with demo thread windows (Inês Almeida, Theo Brandt)
- ISC-188: curl — /chat/demo-thread-1 → 200 with thread view and input
- ISC-189: curl — empty-thread path (no demo matches) renders "No conversations yet" guidance
- ISC-190: curl — messages render with self/other differentiation (data-message markers)
- ISC-191: Grep — Nav.tsx TABS includes { href: "/chat", label: "Chat", accent: "bg-yellow" }
- ISC-192: Grep — proxy.ts PROTECTED includes "/chat"; matcher includes "/chat/:path*"
- ISC-193: Grep — u/[handle]/page.tsx imports and renders MessageButton
- ISC-194: Read — MessageButton hidden for self/preview/signed-out states
- ISC-195: Bash — build (14 routes + proxy), TSC_OK, eslint clean
- ISC-196: curl — / /feed /groups /profile /design /login /post/new /u/ines /p/demo-ines-1 all at expected codes
- ISC-197: DEFERRED — no Supabase creds; follow-up ATELIER-P5-LIVE
- ISC-198: Grep — no read-receipt or typing-indicator code/library in src/ (deferred to post-launch)
- ISC-199: curl/Grep — chat pages compose Window (data-window on /chat); promo grep → 0

### Phase 6 (verified 2026-07-09, commit 4f57977)
- ISC-200: Read — migration 0007: title 3–80, location_type in (venue, online), ticket_url ~ '^https?://' checks
- ISC-201: Read — RLS: public select + 3 owner-only write policies (auth.uid() = profile_id)
- ISC-202: Grep — `events_profile_starts_idx on public.events (profile_id, starts_at)`
- ISC-203: Read — EventItem + EventLocationType = "venue" | "online" exported
- ISC-204: Bash — splitEvents tests: ordering both directions, at-now boundary → upcoming, empty input (5 pass)
- ISC-205: Bash — formatEventDate pinned to exact string "Fri, 14 Aug 2026, 20:00 UTC" (en-GB, UTC)
- ISC-206: Read — demo: ines 2 upcoming + 1 past; theo absent from DEMO_EVENTS
- ISC-207: curl — /profile/events → 200 (inherits /profile/:path* proxy gating)
- ISC-208: curl — data-create-event form with title, datetime-local, location_type select, location, description, ticket_url
- ISC-209: Read — createEvent: title ≥3, Date validity, https?:// URL check, insert with profile_id = user.id
- ISC-210: Read — deleteEvent scoped .eq("profile_id", user.id) + RLS
- ISC-211: curl — preview: data-setup-notice + demo events listed, form disabled
- ISC-212: curl — /profile renders data-manage-events link
- ISC-213: curl — /u/ines events block: demo-event-1 (20 Jul) before demo-event-2 (14 Aug) — ascending
- ISC-214: curl — "Mon, 20 Jul 2026, 19:00 UTC · Marvila, Lisbon" style line per event
- ISC-215: curl — data-ticket-link anchors with target=_blank rel=noopener to ticket_url
- ISC-216: curl — data-past-events <details> present with past event inside
- ISC-217: Read/curl — empty-events branch renders "No events announced."; theo's page clean
- ISC-218: Grep — stripe|checkout|payment in events code → 0 (link-out only)
- ISC-219: Bash — build (15 routes + proxy), TSC_OK, 40 tests / 0 fail, eslint clean (after one unescaped-entity fix)
- ISC-220: curl — 11-route regression battery incl. /chat and /chat/demo-thread-1 all green
- ISC-221: DEFERRED — no Supabase creds; follow-up ATELIER-P6-LIVE
- ISC-222: curl — events render inside Window via ProfileCanvas (data-window wraps the block)

### Phase 7 (verified 2026-07-09, commit d1af16c)
- ISC-223..225: Read — migration 0008: donations checks (amount>0, kind, status), appeals (audience check, goal, active), profiles.is_admin
- ISC-226: Grep — donations has select policy only; zero insert/update policies (webhook/service-role is the sole writer)
- ISC-227: Read — appeals: active-or-admin select; admin-only insert/update
- ISC-228: Bash/Read — stripe@latest installed; getStripe() returns null without STRIPE_SECRET_KEY
- ISC-229: Grep — `mode: recurring ? "subscription" : "payment"` with per-mode price_data (monthly interval)
- ISC-230: Grep — metadata.appeal_id from /donate?appeal= hidden field
- ISC-231: Grep — constructEventAsync(payload, signature, secret) before any processing; missing/invalid sig → 400; unconfigured → 503 (probed live)
- ISC-232: Read — webhook inserts via createServiceClient() (server-only, service role)
- ISC-233: Grep — customer_email on checkout session (Stripe sends receipts)
- ISC-234: Read — .env.example documents all three new secrets with scope warnings
- ISC-235: curl — GET /donate → 200 with no auth gate (public route, outside proxy matcher)
- ISC-236: curl — data-honest-copy: "the only money that comes in… no perks, no boosted reach"
- ISC-237: curl — presets €3/€5/€10/€25 + custom field + One-off/Monthly radios
- ISC-238: curl — preview: data-setup-notice, donate button disabled, 200 no crash
- ISC-239: curl — data-footer-donate link in shell footer
- ISC-240: Grep/curl — /admin in proxy PROTECTED + matcher; page calls isViewerAdmin()
- ISC-241: Read — non-admin → notFound() (404, existence not leaked)
- ISC-242: curl — data-create-appeal form: title, message, goal, audience (3 options), active checkbox
- ISC-243: Read — toggleAppeal flips active + revalidates layout (banner reacts)
- ISC-244: curl — "Raised €220.00 of €600.00 (37%) · 17 donations · reach ~412 (Everyone)" renders
- ISC-245: curl — demo appeal card + 4-row ledger table in preview
- ISC-246: curl — data-appeal-banner server-rendered in shell HTML (exactly one)
- ISC-247: curl — banner "Chip in" → /donate?appeal=<id> (attribution)
- ISC-248: Read — dismissal via cookie-setting server action; layout skips render when cookie matches (refactored from client-state after the curl probe caught the SSR-invisible banner)
- ISC-249: Read — layout renders banner only when an active appeal exists and isn't dismissed
- ISC-250: curl — data-appeal-progress with €220.00 / €600.00 bar
- ISC-251: Grep — donation|appeal references in posts/groups/profile query layers → 0 (money never touches ranking)
- ISC-252: Grep/curl — single AppealBanner render site; no dialog/modal element (only the doc comment stating the rule)
- ISC-253: Bash — build (17 routes + proxy), TSC_OK, 45 tests / 0 fail, eslint clean
- ISC-254: curl — 11-route regression battery all green
- ISC-255: DEFERRED — needs Stripe + Supabase creds; follow-up ATELIER-P7-LIVE
- ISC-256: curl — /donate and /admin/appeals compose Window (data-window present)
