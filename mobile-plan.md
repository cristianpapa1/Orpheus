# Atelier — Mobile Plan (bottom bar + Expo)

> Approved direction, not yet built. Any session/agent can execute from this file.
> Context: all 9 web phases complete (see ISA.md). Mobile top-nav is cramped
> (4 tabs out of thumb reach); Cristian wants a native app via Expo, not web-only.

## M0 — Extract shared core — ✅ DONE 2026-07-10 (commit 47ede35)
Convert repo to **bun workspaces**. Create `packages/core` and move the pure-TS,
zero-DOM modules there (with their ~50 bun tests):
`atelier/src/lib/profile/layout.ts`, `lib/posts/{types,display,image(fitWithin),media(variantWidthsFor)}`,
`lib/jobs/types(filterJobs)`, `lib/events/types(splitEvents)`, `lib/donations/types(formatMoney,progressPct)`,
plus shared type files. `apps/web` = current `atelier/` (imports switch to `@atelier/core`).
Gate: all 50 tests pass from the package; web build/routes unchanged.

## M1 — Web bottom tab bar — ✅ DONE 2026-07-10 (commit c98dd3e)
- `< md`: fixed bottom bar — Feed / Groups / Chat / Profile, icon+label,
  accent-square active indicator, `padding-bottom: env(safe-area-inset-bottom)`.
- Top header shrinks to wordmark + contextual actions; desktop keeps current nav.
- Main content gets bottom padding so the bar never covers it.
Gate: mobile-viewport screenshot shows thumb-reach tabs; desktop unchanged.

## M2 — Expo shell (~2–3 sessions)
`apps/mobile`: Expo + expo-router (native bottom tabs mirroring M1) + NativeWind
(consume the same Bauhaus tokens: ink #121210, paper #F5F3EC, red #E1251B,
blue #2145C9, yellow #F2B705, Space Grotesk) + `@supabase/supabase-js` with
AsyncStorage session. Read-only first: auth, feed, /u profiles, groups.

## M3 — Native parity (~3+ sessions)
- Publish: expo-image-picker → same variant pipeline from `packages/core`.
- Chat: do **ATELIER-P5.1** (Supabase Realtime + image share + read state)
  ONCE here, shared by web + native.
- Push notifications: expo-notifications.

## M4 — Store prep
EAS Build; icons from design system. ⚠️ Apple IAP: platform donations via
Stripe web checkout likely must LINK OUT (Patreon pattern) — review before submission.

## Rejected
WebView wrapper (App Store minimal-functionality rejection risk; wastes the pure core).

## Blockers/inputs
Supabase + Stripe keys (same as LAUNCH.md); Apple/Google developer accounts for M4.
