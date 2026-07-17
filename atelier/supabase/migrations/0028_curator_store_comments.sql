-- Atelier · migration 0028 — curator store links, curator-only comments, comment support
--
--   1. post_curations.store_url — when a curator reposts, they may attach an
--      Astelier product/store link so viewers can follow through and buy.
--   2. Comments become CURATOR-ONLY (is_curator()); everyone else can still read.
--   3. comment_supports — any signed-in member may "support" (like) a comment they
--      view, as a support signal on curators' comments.
--
-- Idempotent — safe to re-run. Requires 0027 (is_curator).

-- --- 1) curator's optional Astelier buy link on a repost --------------------
alter table public.post_curations add column if not exists store_url text;

-- A curator may edit their own curation (to set/clear the store link).
drop policy if exists "curators update own curations" on public.post_curations;
create policy "curators update own curations"
  on public.post_curations for update
  using (curator_id = auth.uid())
  with check (curator_id = auth.uid());

-- --- 2) comments are curator-only --------------------------------------------
-- Replaces the 0017 "any authenticated author" insert policy.
drop policy if exists "users comment as themselves" on public.post_comments;
drop policy if exists "curators comment as themselves" on public.post_comments;
create policy "curators comment as themselves"
  on public.post_comments for insert
  with check (author_id = auth.uid() and public.is_curator(auth.uid()));

-- --- 3) support (like) a comment ---------------------------------------------
create table if not exists public.comment_supports (
  comment_id uuid not null references public.post_comments (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, profile_id)
);
create index if not exists comment_supports_comment_idx on public.comment_supports (comment_id);

alter table public.comment_supports enable row level security;

drop policy if exists "supports are viewable by everyone" on public.comment_supports;
create policy "supports are viewable by everyone"
  on public.comment_supports for select using (true);

-- Any signed-in member may support a comment (the common-user support signal).
drop policy if exists "users support as themselves" on public.comment_supports;
create policy "users support as themselves"
  on public.comment_supports for insert with check (profile_id = auth.uid());

drop policy if exists "users unsupport as themselves" on public.comment_supports;
create policy "users unsupport as themselves"
  on public.comment_supports for delete using (profile_id = auth.uid());
