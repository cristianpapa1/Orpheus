-- Atelier · migration 0010 — trust & safety, a11y media, personalization
-- Phase 9: reporting, blocking, alt text on media, profile accent choice.

-- ── reports ──────────────────────────────────────────────────────
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  subject_type text not null
    check (subject_type in ('post', 'profile', 'group', 'message', 'job')),
  subject_id uuid not null,
  reason text not null check (
    reason in ('spam', 'harassment', 'stolen_work', 'illegal', 'other')
  ),
  detail text not null default '' check (char_length(detail) <= 600),
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz not null default now()
);

create index reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

create policy "users file reports as themselves"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "admins read reports"
  on public.reports for select
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.is_admin));

create policy "admins update reports"
  on public.reports for update
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.is_admin));

-- ── blocks ───────────────────────────────────────────────────────
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create policy "users see their own blocks"
  on public.blocks for select using (blocker_id = auth.uid());
create policy "users block as themselves"
  on public.blocks for insert with check (blocker_id = auth.uid());
create policy "users unblock as themselves"
  on public.blocks for delete using (blocker_id = auth.uid());

-- ── a11y & personalization ───────────────────────────────────────
alter table public.posts
  add column alt_text text check (alt_text is null or char_length(alt_text) <= 300);

alter table public.profiles
  add column accent text not null default 'red'
    check (accent in ('red', 'blue', 'yellow'));
