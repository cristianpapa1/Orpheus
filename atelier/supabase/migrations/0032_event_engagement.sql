-- Atelier · migration 0032 — event engagement (participants + views)
--
-- Events gain a pulse: members can say "I'm going" (event_participants) and the
-- page counts who looked (event_views). Together with Heroes tied to an event
-- (0031's heroes.event_id), an event becomes a living record of how it went —
-- even though the Hero videos themselves still vanish in 24h.
--
--   1. event_participants — one row per member per event → "N going".
--   2. event_views        — one row per viewer per event → engagement count.
--
-- Idempotent — safe to re-run.

-- ── 1) event_participants ────────────────────────────────────────
create table if not exists public.event_participants (
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);
create index if not exists event_participants_event_idx on public.event_participants (event_id);

alter table public.event_participants enable row level security;

drop policy if exists "event participants viewable by everyone" on public.event_participants;
create policy "event participants viewable by everyone"
  on public.event_participants for select using (true);

drop policy if exists "members join events as themselves" on public.event_participants;
create policy "members join events as themselves"
  on public.event_participants for insert with check (profile_id = auth.uid());

drop policy if exists "members leave events as themselves" on public.event_participants;
create policy "members leave events as themselves"
  on public.event_participants for delete using (profile_id = auth.uid());

-- ── 2) event_views ───────────────────────────────────────────────
create table if not exists public.event_views (
  event_id uuid not null references public.events (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, viewer_id)
);
create index if not exists event_views_event_idx on public.event_views (event_id);

alter table public.event_views enable row level security;

drop policy if exists "event views viewable by everyone" on public.event_views;
create policy "event views viewable by everyone"
  on public.event_views for select using (true);

drop policy if exists "viewers record their own event view" on public.event_views;
create policy "viewers record their own event view"
  on public.event_views for insert with check (viewer_id = auth.uid());
