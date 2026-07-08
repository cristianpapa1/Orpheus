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
- ⬜ Phase 1 — profiles (user-constructed windowed layouts)
- ⬜ Phase 2+ — see the build plan
