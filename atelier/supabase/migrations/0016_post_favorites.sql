-- Atelier · migration 0016 — favorite (save) posts
-- A viewer can favorite a post; favorites are public (counts render) and
-- self-managed. Powers the heart button, double-tap-to-favorite, and the
-- /saved browse page.

create table public.post_favorites (
  post_id uuid not null references public.posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create index post_favorites_profile_idx on public.post_favorites (profile_id, created_at desc);

alter table public.post_favorites enable row level security;

create policy "favorites are viewable by everyone"
  on public.post_favorites for select using (true);

create policy "users favorite as themselves"
  on public.post_favorites for insert with check (profile_id = auth.uid());

create policy "users unfavorite as themselves"
  on public.post_favorites for delete using (profile_id = auth.uid());
