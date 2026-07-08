-- Atelier · migration 0002 — profile links + follows
-- Phase 1: profiles gain a links list; creators can follow each other.

alter table public.profiles
  add column links jsonb not null default '[]'::jsonb;

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint no_self_follow check (follower_id <> followee_id)
);

create index follows_followee_idx on public.follows (followee_id);

alter table public.follows enable row level security;

-- Follower graphs are public (counts, who-follows-whom).
create policy "follows are viewable by everyone"
  on public.follows for select
  using (true);

-- You can only follow as yourself.
create policy "users follow as themselves"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "users unfollow as themselves"
  on public.follows for delete
  using (auth.uid() = follower_id);
