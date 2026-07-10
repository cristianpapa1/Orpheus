-- Atelier · migration 0007 — events on profiles
-- Phase 6: musicians and performing artists list upcoming events with
-- ticket links. Link-out only — no ticketing or payments in-platform.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '' check (char_length(description) <= 600),
  starts_at timestamptz not null,
  location text not null default '' check (char_length(location) <= 120),
  location_type text not null default 'venue' check (location_type in ('venue', 'online')),
  ticket_url text check (ticket_url is null or ticket_url ~ '^https?://'),
  created_at timestamptz not null default now()
);

create index events_profile_starts_idx on public.events (profile_id, starts_at);

alter table public.events enable row level security;

create policy "events are viewable by everyone"
  on public.events for select using (true);

create policy "owners create their own events"
  on public.events for insert with check (auth.uid() = profile_id);

create policy "owners update their own events"
  on public.events for update using (auth.uid() = profile_id);

create policy "owners delete their own events"
  on public.events for delete using (auth.uid() = profile_id);
