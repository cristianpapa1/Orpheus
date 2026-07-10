# Orpheus / Atelier

A community-first social platform for creators — art, handmade, photography,
music. No ads, no pay-to-be-seen, no marketplace. Funded by donations.

Bauhaus / Gropius aesthetic: modular windowed layout, geometric type, black &
white with red/blue/yellow accents.

## Stack

**Next.js 16 (App Router)** · **React 19** · **TypeScript** · **Tailwind CSS v4** ·
**Supabase** (Postgres, Auth, Realtime, RLS) · **framer-motion** · **bun**

## Quick start

```bash
cd atelier
bun install
bun dev
```

Open http://localhost:3000. Without Supabase keys, the app runs in **preview
mode** — the shell, design system, demo profiles, posts, groups, and chat are
all explorable without authentication.

To enable sign-in, copy `.env.example` to `.env.local` and add your Supabase
project URL and anon key.

## Phase status

| Phase | What | Status |
|-------|------|--------|
| 0 | Foundation, Bauhaus design system, auth shell | ✅ |
| 1 | Profiles — drag/resize windowed editor, public pages, follow/unfollow | ✅ |
| 2 | Posts & main feed — create-post flow, chronological feed, post detail | ✅ |
| 3 | Media pipeline — full-res originals, WebP variants, blur-up, display personalization | ✅ |
| 4 | Groups & group feeds — create, invite, request-to-join, cross-linking | ✅ |
| 5 | Private chat — direct messages with optimistic send | ✅ |
| 6+ | Events, donations, jobs, polish, launch prep | ⬜ |

## Docs

- **Build plan** — [`atelier-build-plan.md`](atelier-build-plan.md)
- **System of record** — [`ISA.md`](ISA.md) (every criterion, decision, and verification)
- **Design system** — [`atelier/DESIGN.md`](atelier/DESIGN.md)
- **App README** — [`atelier/README.md`](atelier/README.md)

## Directory structure

```
atelier/                   # Next.js application
├── src/
│   ├── app/              # App Router pages & API
│   ├── components/       # React components (ui/, profile/, posts/, chat/)
│   └── lib/              # Shared types, queries, demo data, design tokens
├── supabase/
│   ├── migrations/       # Ordered SQL migrations (0001–0006)
│   └── seed.sql          # Sample data
├── DESIGN.md             # Bauhaus design system reference
└── README.md             # App-specific runbook
ISA.md                     # Project ISA — ideal state, criteria, verification
atelier-build-plan.md      # Original phased build plan
```
# Orpheus
