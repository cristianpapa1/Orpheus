-- 0026 — creator gating + admissions
--
-- Two-tier access. Common members browse freely but cannot publish posts or
-- create groups. Declaring "creator" at signup (or later) files an application
-- to /admin/admissions for manual review; approval flips creator_status to
-- 'approved', notifies the applicant in-app, and emails them. RLS is the hard
-- gate — the UI mirrors it but the database is what actually enforces it.
--
-- Idempotent.

-- ── 1) profiles.creator_status ────────────────────────────────────────────
alter table public.profiles
  add column if not exists creator_status text not null default 'none';
do $$ begin
  alter table public.profiles
    add constraint profiles_creator_status_check
    check (creator_status in ('none', 'pending', 'approved', 'rejected'));
exception when duplicate_object then null; end $$;

-- Grandfather the founding cohort: every account that exists now keeps full
-- access, so nobody mid-flight loses the ability to post. New signups get the
-- 'none' default and must apply.
update public.profiles set creator_status = 'approved' where creator_status = 'none';

-- The operator is the admin and an approved creator.
update public.profiles set is_admin = true, creator_status = 'approved' where handle = 'cris';

-- ── 2) creator_applications — the review queue ─────────────────────────────
create table if not exists public.creator_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  statement text not null,                          -- what they'll use the platform for / what they'll post
  links jsonb not null default '[]'::jsonb,         -- proof: portfolio, socials, published work
  review_note text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists creator_applications_status_idx
  on public.creator_applications (status, created_at desc);
create index if not exists creator_applications_profile_idx
  on public.creator_applications (profile_id, created_at desc);

alter table public.creator_applications enable row level security;

-- The applicant sees their own applications; admins see every one.
drop policy if exists "read own or admin creator applications" on public.creator_applications;
create policy "read own or admin creator applications"
  on public.creator_applications for select
  using (
    profile_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- A signed-in user files their own application (never on someone else's behalf).
drop policy if exists "users file their own creator application" on public.creator_applications;
create policy "users file their own creator application"
  on public.creator_applications for insert
  with check (profile_id = auth.uid());

-- Admins review (the approve/reject actions also use the service role).
drop policy if exists "admins review creator applications" on public.creator_applications;
create policy "admins review creator applications"
  on public.creator_applications for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ── 3) gate posts + groups inserts to approved creators ────────────────────
drop policy if exists "authors insert their own posts" on public.posts;
create policy "approved creators insert their own posts"
  on public.posts for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.creator_status = 'approved'
    )
  );

drop policy if exists "signed-in users create groups as themselves" on public.groups;
create policy "approved creators create groups as themselves"
  on public.groups for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.creator_status = 'approved'
    )
  );

-- ── 3b) freeze privileged columns against self-escalation ─────────────────
-- profiles' UPDATE policy (0001) is `using (auth.uid() = id)` with no column
-- restriction — so without this a user could set their own is_admin or
-- creator_status and bypass review entirely. RLS can't gate columns; a trigger
-- can. Only the service role (the admin actions) may change these; a normal
-- session that tries is rejected. This also hardens the pre-existing is_admin.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  -- Only block logged-in end users. The service role (admin actions) and direct
  -- SQL (you, in the editor) may set these columns.
  if auth.role() = 'authenticated' then
    if new.is_admin is distinct from old.is_admin
       or new.creator_status is distinct from old.creator_status then
      raise exception 'creator_status and is_admin are set by review, not by the user';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists guard_profile_privileges on public.profiles;
create trigger guard_profile_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- ── 4) notifications: creator decisions ────────────────────────────────────
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'favorite', 'share', 'mention', 'comment', 'claim_approved', 'follow',
    'quality_stamp', 'group_message', 'creator_approved', 'creator_rejected'
  ));
