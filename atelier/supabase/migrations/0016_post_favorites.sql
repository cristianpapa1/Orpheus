-- Atelier · migration 0016 — favorite (save) posts
-- A viewer can favorite a post; favorites are public (counts render) and
-- self-managed. Powers the heart button, double-tap-to-favorite, and the
-- /saved browse page. Idempotent — safe to re-run.

create table if not exists public.post_favorites (
  post_id uuid not null references public.posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create index if not exists post_favorites_profile_idx
  on public.post_favorites (profile_id, created_at desc);

alter table public.post_favorites enable row level security;

drop policy if exists "favorites are viewable by everyone" on public.post_favorites;
create policy "favorites are viewable by everyone"
  on public.post_favorites for select using (true);

drop policy if exists "users favorite as themselves" on public.post_favorites;
create policy "users favorite as themselves"
  on public.post_favorites for insert with check (profile_id = auth.uid());

drop policy if exists "users unfavorite as themselves" on public.post_favorites;
create policy "users unfavorite as themselves"
  on public.post_favorites for delete using (profile_id = auth.uid());
