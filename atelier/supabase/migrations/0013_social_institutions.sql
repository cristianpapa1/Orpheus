-- Atelier · migration 0013 — onboarding, institutions, contacts, categories, mentions
-- Phase 13: profiles gain an account type (individual | institution), interests,
-- and an onboarding stamp; posts gain a wider category set + a subcategory;
-- creators can tag people they MUTUALLY follow into a post.

-- ── profiles: account type, institution kind, interests, onboarding ──
alter table public.profiles
  add column account_type text not null default 'individual'
    check (account_type in ('individual', 'institution')),
  add column institution_kind text
    check (institution_kind in (
      'museum', 'gallery', 'publisher', 'journal', 'label', 'theater',
      'festival', 'collective', 'podcast', 'school', 'studio', 'other'
    )),
  add column interests text[] not null default '{}',
  add column onboarded_at timestamptz;

-- An individual can never carry an institution_kind (kept honest at the DB).
alter table public.profiles
  add constraint institution_kind_requires_institution check (
    institution_kind is null or account_type = 'institution'
  );

-- Backfill: anyone who already picked a handle is treated as onboarded, so
-- existing functional users are not forced back through onboarding. Handle-less
-- rows (the source of the cross-user 404) get onboarding on their next login.
update public.profiles set onboarded_at = now() where handle is not null;

-- ── posts: wider category set + optional subcategory ─────────────────
-- Legacy 'art' was too generic — migrate it into 'visual' before re-constraining.
alter table public.posts drop constraint posts_category_check;
update public.posts set category = 'visual' where category = 'art';
alter table public.posts
  add constraint posts_category_check check (category in (
    'music', 'writing', 'theater', 'film', 'dance',
    'visual', 'photography', 'handmade'
  ));

alter table public.posts
  add column subcategory text check (subcategory is null or char_length(subcategory) <= 40);

-- ── post mentions: tag people you MUTUALLY follow ────────────────────
create table public.post_mentions (
  post_id uuid not null references public.posts (id) on delete cascade,
  mentioned_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, mentioned_id)
);

create index post_mentions_mentioned_idx on public.post_mentions (mentioned_id);

alter table public.post_mentions enable row level security;

-- Mentions are public (they render as links on the post + power "mentioned you").
create policy "post mentions are viewable by everyone"
  on public.post_mentions for select using (true);

-- You may only mention someone on YOUR OWN post, and only if the two of you
-- follow each other (mutual). Enforced in the policy AND in the server action.
create policy "authors mention mutual-follows on own posts"
  on public.post_mentions for insert
  with check (
    exists (select 1 from public.posts p
            where p.id = post_id and p.author_id = auth.uid())
    and exists (select 1 from public.follows f
                where f.follower_id = auth.uid() and f.followee_id = mentioned_id)
    and exists (select 1 from public.follows g
                where g.follower_id = mentioned_id and g.followee_id = auth.uid())
  );

create policy "authors remove mentions on own posts"
  on public.post_mentions for delete
  using (exists (select 1 from public.posts p
                 where p.id = post_id and p.author_id = auth.uid()));
