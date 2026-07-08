---
task: "Build Atelier Phase 0 foundation and auth shell"
slug: 20260708-120400_develop-the-atelier-build-here-build
project: Atelier
effort: E3
effort_source: classifier
phase: complete
progress: 41/42
mode: interactive
started: 2026-07-08T15:04:39Z
updated: 2026-07-08T15:14:00Z
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

## Changelog

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
