-- Atelier · migration 0009 — job posts on profiles
-- Phase 8: help artists find work. Link-out or chat to apply — no
-- payments, contracts, or escrow in-platform. Discovery is chronological;
-- there is no paid placement of any kind.

create table public.job_posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  discipline text not null check (
    discipline in ('art', 'handmade', 'photography', 'music', 'design', 'other')
  ),
  description text not null default '' check (char_length(description) <= 2000),
  location text not null default '' check (char_length(location) <= 120),
  work_mode text not null default 'remote'
    check (work_mode in ('remote', 'on_site', 'hybrid')),
  compensation text not null default 'Negotiable'
    check (char_length(compensation) <= 120),
  apply_url text check (apply_url is null or apply_url ~ '^https?://'),
  status text not null default 'open' check (status in ('open', 'filled', 'closed')),
  created_at timestamptz not null default now()
);

create index job_posts_discovery_idx on public.job_posts (status, created_at desc);
create index job_posts_profile_idx on public.job_posts (profile_id);

alter table public.job_posts enable row level security;

create policy "job posts are viewable by everyone"
  on public.job_posts for select using (true);

create policy "owners create their own job posts"
  on public.job_posts for insert with check (auth.uid() = profile_id);

create policy "owners update their own job posts"
  on public.job_posts for update using (auth.uid() = profile_id);

create policy "owners delete their own job posts"
  on public.job_posts for delete using (auth.uid() = profile_id);
