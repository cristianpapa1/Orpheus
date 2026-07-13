-- Atelier · migration 0017 — notifications + post comments
-- Notifications: someone favorited/mentioned/commented on your work, followed
-- you, or an admin approved your claim. Comments: threaded conversation under
-- a post (same report/removal path as any content). Idempotent — safe to re-run.

-- ── notifications ────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null check (type in (
    'favorite', 'share', 'mention', 'comment', 'claim_approved', 'follow'
  )),
  subject_type text not null default 'post' check (subject_type in ('post', 'profile')),
  subject_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications"
  on public.notifications for select using (recipient_id = auth.uid());

-- You may only create notifications you actually caused (actor = you).
drop policy if exists "actors create notifications" on public.notifications;
create policy "actors create notifications"
  on public.notifications for insert with check (actor_id = auth.uid());

drop policy if exists "recipient updates own notifications" on public.notifications;
create policy "recipient updates own notifications"
  on public.notifications for update using (recipient_id = auth.uid());

drop policy if exists "recipient deletes own notifications" on public.notifications;
create policy "recipient deletes own notifications"
  on public.notifications for delete using (recipient_id = auth.uid());

-- ── post comments ────────────────────────────────────────────────
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_idx
  on public.post_comments (post_id, created_at);

alter table public.post_comments enable row level security;

drop policy if exists "comments are viewable by everyone" on public.post_comments;
create policy "comments are viewable by everyone"
  on public.post_comments for select using (true);

drop policy if exists "users comment as themselves" on public.post_comments;
create policy "users comment as themselves"
  on public.post_comments for insert with check (author_id = auth.uid());

-- The comment's author or an admin may remove it.
drop policy if exists "authors or admins delete comments" on public.post_comments;
create policy "authors or admins delete comments"
  on public.post_comments for delete using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );
