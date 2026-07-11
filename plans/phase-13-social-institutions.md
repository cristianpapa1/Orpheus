# Phase 13 — Onboarding, Contact Info, Categories, Institutions, Seeding

> Source: user session 2026-07-11 (screenshots of `/profile/edit` + `/u/cris`).
> Scope is large; this doc sequences it into build waves. **Wave A + B ship in
> this session** (fixes + core social features). **Wave C** (Firecrawl institution
> seeding) is decision-ready but gated on an API key + go-signal.

## The requests, decoded

| # | Ask | Decision |
|---|-----|----------|
| 1 | 404 viewing another user's profile | Root cause: `handle_new_user()` sets `handle = NULL` and nothing forces one. A handle-less user has **no reachable URL**; group/mention links resolve to `/u/` → 404. Fix = forced onboarding + `/u/[handle]` resolves by **id fallback** + link guards. |
| 2 | No "follow group" button inside a group | Button exists but only when `relation === 'none'` and is `disabled` in preview. Make follow reachable from the **groups list** too, and clarify copy. |
| 3 | Tag people you mutually follow, in posts | New `post_mentions` table + `getMutualFollows()` + composer multi-select. Only mutual follows are taggable (both directions in `follows`). |
| 4 | Edit button on the public profile (owner) | On `/u/[handle]`, when `state === 'self'`, render **Edit your space** → `/profile/edit`. |
| 5 | Post categories: drop "art" (too generic); add music+style, theater, writers/poetry | New taxonomy with **category + optional subcategory**. Migrate legacy `art` → `visual`. |
| 6 | First login should prompt profile setup (public name) | New `/onboarding` flow, entered from the auth callback when `onboarded_at IS NULL`. |
| 7 | Rename "Links" → "Contact Information"; typed entries (link/phone/email/…) | `ContactEntry { kind, label, value }` reusing the `links` jsonb column (back-compat). |
| 8 | Username must not be the email | Onboarding forces a real display name + handle; both required, neither defaults to email. |
| 9 | Institutions (museums, producers, fashion/cinema/theater, journals) | `account_type ∈ {individual, institution}` + `institution_kind`. **Not** called "enterprise". |
| 10 | Push interests at first login → easier group discovery | Onboarding collects `interests[]`; discovery suggests groups by interest. |
| 11 | Firecrawl-seed real institutions (Guggenheim, publishers, bookstores) | Wave C pipeline: crawl → structure → **staging review** → seed profiles+groups+media. Gated. |
| 12 | Journals like The New Yorker can use it | `institution_kind = 'journal'`. Covered by #9. |
| 13 | Podcasts sector; they form groups, cross-share posts | `institution_kind = 'podcast'`. Groups already support cross-member posting. Wave C seeds a few. |

## Taxonomy (single source of truth: `packages/core/src/posts/types.ts`)

Categories (replace `art`): **music, writing, theater, film, dance, visual, photography, handmade**.
Subcategories (optional, only where meaningful):
- music → classical, jazz, electronic, hip-hop, rock, folk, ambient, experimental, world, pop
- writing → poetry, fiction, essay, playwriting, journalism, criticism
- theater → drama, comedy, physical, musical-theater, performance
- film → short, documentary, animation, experimental, music-video
- visual → painting, drawing, sculpture, printmaking, illustration, digital, mixed-media

Interests = the union of categories + the 5 artistic schools (shared list for onboarding chips).

## Institution kinds
`museum, gallery, publisher, journal, label, theater, festival, collective, podcast, school, studio, other`.
Institutions are **profiles with more affordances** — they post, form groups, run events/jobs — never a separate paywalled tier.

## Wave A — schema + fixes (this session)
1. Migration `0013_social_institutions.sql`.
2. Core type changes (posts + profile).
3. Self-edit button on public profile.
4. `/u/[handle]` id-fallback + handle-less link guards.

## Wave B — social features (this session)
5. `/onboarding` route + `completeOnboarding` action + auth-callback gate.
6. Contact Information (typed entries) in editor + canvas.
7. New category + subcategory UI in the composer.
8. Mutual-follow tagging in the composer + `post_mentions` write + render on post page.
9. Group follow from the groups list; interest-based suggestions.

## Wave C — Firecrawl institution seeding (gated: needs `FIRECRAWL_API_KEY` + go-signal)
Pipeline (`atelier/scripts/seed-institutions.ts`, dry-run by default):
1. Curated seed list of institutions (name, url, kind) — start ~12: Guggenheim, MoMA, Tate,
   The New Yorker, Paris Review, Criterion, A24, Poetry Foundation, Strand Books, Deutsche
   Grammophon, Radiotopia, The Moth.
2. Firecrawl scrape each site → title, description, hero image(s), social links.
3. Structure into a staging JSON (`scripts/seed-staging/institutions.json`) — **no DB writes**.
4. Human review of staging file.
5. Seed step (`--commit`): upsert institution profiles (service role), create a starter group
   per kind, attach reviewed media. Media downloaded to the `media` bucket under a system folder.

**Go-signals for Wave C:** (a) provide `FIRECRAWL_API_KEY`; (b) confirm the curated list;
(c) confirm we seed *public, factual* profiles clearly labeled as unofficial/community until a
real owner claims them (avoids impersonation). Claiming flow = a later phase.

## Anti-criteria (do not regress)
- No read path drops RLS. `post_mentions` is public-select like other social graphs.
- Onboarding cannot be skipped into a half-built profile, but must never hard-loop (guard `/onboarding` when already onboarded).
- Legacy `art` posts keep rendering (migrated, not deleted).
- Stored profile layouts keep working — the "links" block type key is unchanged; only its **label** becomes "Contact".
