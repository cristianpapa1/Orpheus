-- Atelier · migration 0031 — Heroes (ephemeral vertical short video)
--
-- "We can be heroes, just for one day." A public, vertical short-video surface
-- where every clip lives 24 hours and then vanishes. Open to any member (not
-- creator-gated — Heroes is the "everyone" surface), moderated on publish, tied
-- optionally to an event so people can see how a show/film/gig actually was.
--
--   1. heroes          — the clips. Public read WHILE LIVE (expires_at > now()).
--   2. hero_views      — one row per viewer per hero → view count + reach.
--   3. hero_favorites  — likes (any member).
--
-- Video + poster live in the media bucket at {uid}/heroes/… (owner-folder
-- storage policy from 0003 already covers it). Nothing here persists past 24h;
-- a scheduled purge (later phase) reclaims storage. Idempotent — safe to re-run.

-- ── 1) heroes ────────────────────────────────────────────────────
create table if not exists public.heroes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  media_path text not null,                 -- the video, {uid}/heroes/…
  poster_path text,                         -- poster frame (webp variant), {uid}/heroes/…
  width int,
  height int,
  duration_seconds int not null check (duration_seconds > 0 and duration_seconds <= 90),
  caption text not null default '' check (char_length(caption) <= 600),
  alt_text text check (alt_text is null or char_length(alt_text) <= 300),
  event_id uuid references public.events (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists heroes_live_idx on public.heroes (expires_at, created_at desc);
create index if not exists heroes_author_idx on public.heroes (author_id);
create index if not exists heroes_event_idx on public.heroes (event_id);

alter table public.heroes enable row level security;

-- Public — but only while the clip is still alive. Once expires_at passes, the
-- row is invisible to everyone (including its author) even before it's purged.
drop policy if exists "live heroes are viewable by everyone" on public.heroes;
create policy "live heroes are viewable by everyone"
  on public.heroes for select using (expires_at > now());

-- Any authenticated member may post their own Hero (open surface; the app
-- moderates on publish and bounds media paths to the caller's folder).
drop policy if exists "members post their own heroes" on public.heroes;
create policy "members post their own heroes"
  on public.heroes for insert with check (author_id = auth.uid());

-- The author or an admin may remove a Hero early.
drop policy if exists "authors or admins delete heroes" on public.heroes;
create policy "authors or admins delete heroes"
  on public.heroes for delete using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ── 2) hero_views ────────────────────────────────────────────────
create table if not exists public.hero_views (
  hero_id uuid not null references public.heroes (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (hero_id, viewer_id)
);
create index if not exists hero_views_hero_idx on public.hero_views (hero_id);

alter table public.hero_views enable row level security;

drop policy if exists "hero views are viewable by everyone" on public.hero_views;
create policy "hero views are viewable by everyone"
  on public.hero_views for select using (true);

drop policy if exists "viewers record their own view" on public.hero_views;
create policy "viewers record their own view"
  on public.hero_views for insert with check (viewer_id = auth.uid());

-- ── 3) hero_favorites ────────────────────────────────────────────
create table if not exists public.hero_favorites (
  hero_id uuid not null references public.heroes (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (hero_id, profile_id)
);
create index if not exists hero_favorites_hero_idx on public.hero_favorites (hero_id);

alter table public.hero_favorites enable row level security;

drop policy if exists "hero favorites are viewable by everyone" on public.hero_favorites;
create policy "hero favorites are viewable by everyone"
  on public.hero_favorites for select using (true);

drop policy if exists "members favorite heroes as themselves" on public.hero_favorites;
create policy "members favorite heroes as themselves"
  on public.hero_favorites for insert with check (profile_id = auth.uid());

drop policy if exists "members unfavorite heroes as themselves" on public.hero_favorites;
create policy "members unfavorite heroes as themselves"
  on public.hero_favorites for delete using (profile_id = auth.uid());
