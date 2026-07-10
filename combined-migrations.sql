
-- ════════ supabase/migrations/0001_profiles.sql ════════
-- Atelier · migration 0001 — profiles
-- Every auth user gets a profile row. The `layout` JSONB column is the
-- seed of Phase 1's user-constructed windowed profile.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique check (handle ~ '^[a-z0-9_]{3,30}$'),
  display_name text,
  avatar_url text,
  bio text,
  layout jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profiles are public spaces: anyone can view.
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Only the owner writes their own profile.
create policy "users insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile when a user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════ supabase/migrations/0002_profile_links_follows.sql ════════
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

-- ════════ supabase/migrations/0003_posts.sql ════════
-- Atelier · migration 0003 — posts + media storage
-- Phase 2: creators publish work. Image-first; full-res pipeline is Phase 3.

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  caption text not null default '' check (char_length(caption) <= 1000),
  category text not null check (category in ('art', 'handmade', 'photography', 'music')),
  image_path text not null,
  image_width int,
  image_height int,
  created_at timestamptz not null default now()
);

-- Feed scans: an author's posts, newest first.
create index posts_author_created_idx on public.posts (author_id, created_at desc);

alter table public.posts enable row level security;

-- Work is public.
create policy "posts are viewable by everyone"
  on public.posts for select
  using (true);

-- Only the author publishes or removes their own work.
create policy "authors insert their own posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "authors delete their own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

-- ── media storage ────────────────────────────────────────────────
-- Public-read bucket; each user may only write inside their own folder
-- (<user-id>/...), so nobody can overwrite anyone else's media.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "users upload to their own media folder"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "users delete from their own media folder"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ════════ supabase/migrations/0004_media_pipeline.sql ════════
-- Atelier · migration 0004 — media pipeline + display personalization
-- Phase 3: originals preserved untouched at {user}/originals/…, optimized
-- display variants at {user}/display/… (both covered by the owner-folder
-- storage policies from 0003). Per-post display config powers bold
-- personalization (frame / span / aspect).
--
-- CDN note: variants are generated in-app today. Swapping to an image CDN
-- later means changing the variant URLs, not this schema.

alter table public.posts
  add column original_path text,
  add column variants jsonb not null default '[]'::jsonb,
  add column blur_data text check (char_length(blur_data) <= 6000),
  add column display jsonb not null default '{}'::jsonb;

-- ════════ supabase/migrations/0005_groups.sql ════════
-- Atelier · migration 0005 — groups & group feeds
-- Phase 4: creators form groups by inviting each other. Two relationships:
-- MEMBER (can tag posts into the group) vs FOLLOWER (sees content, can't tag)
-- — structurally distinct tables, not a role flag.

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 60),
  slug text unique not null check (slug ~ '^[a-z0-9-]{3,60}$'),
  description text not null default '' check (char_length(description) <= 600),
  is_private boolean not null default false, -- privacy of the group feed
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (group_id, profile_id)
);

create table public.group_followers (
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, profile_id)
);

create table public.group_invites (
  group_id uuid not null references public.groups (id) on delete cascade,
  invitee_id uuid not null references public.profiles (id) on delete cascade,
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, invitee_id)
);

create table public.group_join_requests (
  group_id uuid not null references public.groups (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, requester_id)
);

create table public.post_groups (
  post_id uuid not null references public.posts (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, group_id)
);

create index post_groups_group_idx on public.post_groups (group_id);

-- ── RLS ──────────────────────────────────────────────────────────

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_followers enable row level security;
alter table public.group_invites enable row level security;
alter table public.group_join_requests enable row level security;
alter table public.post_groups enable row level security;

-- Groups are discoverable (private groups gate their FEED, not their card).
create policy "groups are viewable by everyone"
  on public.groups for select using (true);

create policy "signed-in users create groups as themselves"
  on public.groups for insert
  with check (auth.uid() = created_by);

create policy "owners update their groups"
  on public.groups for update
  using (exists (
    select 1 from public.group_members m
    where m.group_id = id and m.profile_id = auth.uid() and m.role = 'owner'
  ));

-- Membership is public (member lists render on group pages).
create policy "memberships are viewable by everyone"
  on public.group_members for select using (true);

-- Three legitimate paths into a group:
--   1. creator bootstraps their own owner row
--   2. an invitee accepts an invite (self-insert)
--   3. an owner approves a join request (inserts the requester's row)
create policy "creators bootstrap owner membership"
  on public.group_members for insert
  with check (
    profile_id = auth.uid()
    and role = 'owner'
    and exists (select 1 from public.groups g
                where g.id = group_id and g.created_by = auth.uid())
  );

create policy "invitees join via invite"
  on public.group_members for insert
  with check (
    profile_id = auth.uid()
    and role = 'member'
    and exists (select 1 from public.group_invites i
                where i.group_id = group_members.group_id
                  and i.invitee_id = auth.uid())
  );

create policy "owners admit approved requesters"
  on public.group_members for insert
  with check (
    role = 'member'
    and exists (select 1 from public.group_members m
                where m.group_id = group_members.group_id
                  and m.profile_id = auth.uid() and m.role = 'owner')
    and exists (select 1 from public.group_join_requests r
                where r.group_id = group_members.group_id
                  and r.requester_id = group_members.profile_id)
  );

create policy "members leave on their own"
  on public.group_members for delete
  using (profile_id = auth.uid());

-- Followers: public counts, self-managed rows.
create policy "group follows are viewable by everyone"
  on public.group_followers for select using (true);
create policy "users follow groups as themselves"
  on public.group_followers for insert with check (profile_id = auth.uid());
create policy "users unfollow groups as themselves"
  on public.group_followers for delete using (profile_id = auth.uid());

-- Invites: visible to the invitee and to group members; sent by members.
create policy "invites visible to invitee and members"
  on public.group_invites for select
  using (
    invitee_id = auth.uid()
    or exists (select 1 from public.group_members m
               where m.group_id = group_invites.group_id
                 and m.profile_id = auth.uid())
  );
create policy "members send invites as themselves"
  on public.group_invites for insert
  with check (
    inviter_id = auth.uid()
    and exists (select 1 from public.group_members m
                where m.group_id = group_invites.group_id
                  and m.profile_id = auth.uid())
  );
create policy "invitee or inviter removes an invite"
  on public.group_invites for delete
  using (invitee_id = auth.uid() or inviter_id = auth.uid());

-- Join requests: requester-created; visible to requester and members.
create policy "requests visible to requester and members"
  on public.group_join_requests for select
  using (
    requester_id = auth.uid()
    or exists (select 1 from public.group_members m
               where m.group_id = group_join_requests.group_id
                 and m.profile_id = auth.uid())
  );
create policy "users request to join as themselves"
  on public.group_join_requests for insert
  with check (requester_id = auth.uid());
create policy "requester withdraws or owner resolves"
  on public.group_join_requests for delete
  using (
    requester_id = auth.uid()
    or exists (select 1 from public.group_members m
               where m.group_id = group_join_requests.group_id
                 and m.profile_id = auth.uid() and m.role = 'owner')
  );

-- Post tags: public (feed markers); only the post's author tags, and only
-- into groups where the author is a MEMBER (followers can't tag — the
-- member/follower distinction, enforced at the database).
create policy "post tags are viewable by everyone"
  on public.post_groups for select using (true);

create policy "authors tag own posts into their groups"
  on public.post_groups for insert
  with check (
    exists (select 1 from public.posts p
            where p.id = post_id and p.author_id = auth.uid())
    and exists (select 1 from public.group_members m
                where m.group_id = post_groups.group_id
                  and m.profile_id = auth.uid())
  );

create policy "authors untag own posts"
  on public.post_groups for delete
  using (exists (select 1 from public.posts p
                 where p.id = post_id and p.author_id = auth.uid()));

-- ════════ supabase/migrations/0006_chat.sql ════════
-- Atelier · migration 0006 — private chat (Phase 5)
-- 1:1 direct messages using Supabase Realtime. RLS so only thread
-- participants can read/write. Thread rows are created deterministically
-- so the "message" action always knows which thread_id to use.

create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references public.profiles (id) on delete cascade,
  participant_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- A→B and B→A are the same thread — the insert trigger enforces ordering
  -- so one unique constraint catches both directions.
  constraint chat_threads_participants_check check (participant_a <> participant_b)
);

-- Enforce (A,B) uniqueness regardless of order: always store the smaller id
-- as participant_a so the PK catches duplicates in both directions.
create or replace function public.normalize_thread_participants()
returns trigger as $$
begin
  if new.participant_a > new.participant_b then
    new.participant_a := new.participant_b;
    new.participant_b := new.participant_a;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_chat_threads_normalize
  before insert on public.chat_threads
  for each row execute function public.normalize_thread_participants();

create unique index chat_threads_participants_uniq
  on public.chat_threads (least(participant_a, participant_b), greatest(participant_a, participant_b));

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index chat_messages_thread_idx on public.chat_messages (thread_id, created_at);

-- ── RLS ──────────────────────────────────────────────────────────

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

-- A user sees a thread when they are one of the two participants.
create policy "participants view their threads"
  on public.chat_threads for select
  using (auth.uid() in (participant_a, participant_b));

-- Either participant can create a thread (the trigger normalizes ordering).
create policy "participants create threads"
  on public.chat_threads for insert
  with check (auth.uid() in (participant_a, participant_b));

-- Messages are visible to thread participants only.
create policy "participants view thread messages"
  on public.chat_messages for select
  using (exists (
    select 1 from public.chat_threads t
    where t.id = thread_id
      and auth.uid() in (t.participant_a, t.participant_b)
  ));

-- A participant can insert their own messages into their threads.
create policy "participants send messages"
  on public.chat_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_threads t
      where t.id = thread_id
        and auth.uid() in (t.participant_a, t.participant_b)
    )
  );

-- ════════ supabase/migrations/0007_events.sql ════════
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

-- ════════ supabase/migrations/0008_donations.sql ════════
-- Atelier · migration 0008 — donations & admin appeals
-- Phase 7: the ONLY money flow into the platform. Voluntary donations,
-- recorded exclusively by the Stripe webhook (service role) — there is
-- deliberately NO client insert policy on donations. Appeals are manual,
-- admin-triggered, and never coupled to feed visibility.

alter table public.profiles
  add column is_admin boolean not null default false;

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 80),
  message text not null check (char_length(message) <= 600),
  goal_cents int check (goal_cents is null or goal_cents > 0),
  audience text not null default 'everyone'
    check (audience in ('everyone', 'past_donors', 'active_users')),
  active boolean not null default false,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references public.profiles (id) on delete set null,
  donor_email text,
  amount_cents int not null check (amount_cents > 0),
  currency text not null default 'eur' check (char_length(currency) = 3),
  kind text not null check (kind in ('one_off', 'recurring')),
  status text not null default 'succeeded'
    check (status in ('pending', 'succeeded', 'refunded', 'canceled')),
  stripe_session_id text unique,
  stripe_subscription_id text,
  appeal_id uuid references public.appeals (id) on delete set null,
  created_at timestamptz not null default now()
);

create index donations_appeal_idx on public.donations (appeal_id);
create index donations_created_idx on public.donations (created_at desc);

alter table public.appeals enable row level security;
alter table public.donations enable row level security;

-- Active appeals are public (they power the banner). Full list: admins.
create policy "active appeals are viewable by everyone"
  on public.appeals for select
  using (
    active = true
    or exists (select 1 from public.profiles p
               where p.id = auth.uid() and p.is_admin)
  );

create policy "admins create appeals"
  on public.appeals for insert
  with check (exists (select 1 from public.profiles p
                      where p.id = auth.uid() and p.is_admin));

create policy "admins update appeals"
  on public.appeals for update
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.is_admin));

-- Donations: donors see their own; admins see the ledger.
-- NO insert/update policy — only the service-role webhook writes rows.
create policy "donors and admins read donations"
  on public.donations for select
  using (
    donor_id = auth.uid()
    or exists (select 1 from public.profiles p
               where p.id = auth.uid() and p.is_admin)
  );

-- ════════ supabase/migrations/0009_jobs.sql ════════
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

-- ════════ supabase/migrations/0010_launch_prep.sql ════════
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

-- ════════ supabase/migrations/0011_events_media_schools.sql ════════
-- Atelier · migration 0011 — global events index, AV media, art schools
-- Evolution tracks C (events discovery), B (video/audio posts), A (schools).

-- ── Track C: platform-wide upcoming-events scans ─────────────────
create index events_starts_idx on public.events (starts_at);

-- ── Track B: posts beyond images ─────────────────────────────────
-- media_type drives rendering; the original AV file lives untouched at
-- {user}/media/… (owner-folder storage policy already covers it).
-- Poster images reuse the existing display-variant pipeline.
alter table public.posts
  add column media_type text not null default 'image'
    check (media_type in ('image', 'video', 'audio')),
  add column media_path text,
  add column duration_seconds int check (
    duration_seconds is null or (duration_seconds > 0 and duration_seconds <= 300)
  );

-- video ≤120s, audio ≤300s, image has no duration (app-enforced too)
alter table public.posts add constraint posts_media_duration_check check (
  (media_type = 'image' and media_path is null and duration_seconds is null)
  or (media_type = 'video' and media_path is not null and duration_seconds <= 120)
  or (media_type = 'audio' and media_path is not null)
);

-- ── Track A: artistic school per profile ─────────────────────────
alter table public.profiles
  add column school text not null default 'bauhaus'
    check (school in ('bauhaus', 'de-stijl', 'constructivism', 'swiss', 'memphis'));
