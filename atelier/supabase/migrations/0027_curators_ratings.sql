-- Atelier · migration 0027 — curators & star ratings
--
-- Two new capabilities:
--   1. Members can give a 1–5 star rating to work they favorite (post_ratings).
--   2. A "curator" — an EARNED, automatic capability (no admin grant): a profile
--      qualifies the moment it has ≥3 institution accounts that mutually follow
--      it AND it follows ≥30 quality-stamped accounts (is_curator()). Curators can
--      repost others' work as "curated" (post_curations); those picks surface in
--      their followers' feeds and on a public "Curated" shelf. The curator badge is
--      incompatible with owning an Astelier shop — enforced in the app (Astelier
--      reads is_curator() over the shared DB).
--
-- Idempotent — safe to re-run.

-- --- 1–5 star ratings on favorited work -------------------------------------
create table if not exists public.post_ratings (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, post_id)
);
create index if not exists post_ratings_profile_idx on public.post_ratings (profile_id);

alter table public.post_ratings enable row level security;

drop policy if exists "ratings are viewable by everyone" on public.post_ratings;
create policy "ratings are viewable by everyone"
  on public.post_ratings for select using (true);

drop policy if exists "users rate as themselves" on public.post_ratings;
create policy "users rate as themselves"
  on public.post_ratings for insert with check (profile_id = auth.uid());

drop policy if exists "users update own ratings" on public.post_ratings;
create policy "users update own ratings"
  on public.post_ratings for update using (profile_id = auth.uid());

drop policy if exists "users delete own ratings" on public.post_ratings;
create policy "users delete own ratings"
  on public.post_ratings for delete using (profile_id = auth.uid());

-- --- the automatic curator capability test ----------------------------------
-- security definer so the check sees the whole follow graph regardless of the
-- caller; stable + fixed search_path per Supabase guidance.
create or replace function public.is_curator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((
      -- ≥3 institutions that the user follows AND that follow the user back
      select count(*) >= 3
      from public.follows a
      join public.follows b
        on b.follower_id = a.followee_id and b.followee_id = a.follower_id
      join public.profiles p on p.id = a.followee_id
      where a.follower_id = uid and p.account_type = 'institution'
    ), false)
    and
    coalesce((
      -- ≥30 quality-stamped accounts the user follows
      select count(*) >= 30
      from public.follows f
      join public.profiles p on p.id = f.followee_id
      where f.follower_id = uid and p.quality_stamp = true
    ), false);
$$;

grant execute on function public.is_curator(uuid) to anon, authenticated;

-- --- curations (a curator's "repost") ---------------------------------------
create table if not exists public.post_curations (
  curator_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (curator_id, post_id)
);
create index if not exists post_curations_post_idx on public.post_curations (post_id);
create index if not exists post_curations_curator_idx
  on public.post_curations (curator_id, created_at desc);

alter table public.post_curations enable row level security;

drop policy if exists "curations are viewable by everyone" on public.post_curations;
create policy "curations are viewable by everyone"
  on public.post_curations for select using (true);

-- Only a qualifying curator may repost, only as themselves, and only another
-- maker's live post (no self-reposting, no reposting removed work).
drop policy if exists "curators repost as themselves" on public.post_curations;
create policy "curators repost as themselves"
  on public.post_curations for insert
  with check (
    curator_id = auth.uid()
    and public.is_curator(auth.uid())
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.removed_at is null and p.author_id <> auth.uid()
    )
  );

drop policy if exists "curators remove own curations" on public.post_curations;
create policy "curators remove own curations"
  on public.post_curations for delete using (curator_id = auth.uid());

-- --- notifications: allow the 'curated' type --------------------------------
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'favorite', 'share', 'mention', 'comment', 'claim_approved', 'follow',
    'quality_stamp', 'group_message', 'creator_approved', 'creator_rejected',
    'curated'
  ));
