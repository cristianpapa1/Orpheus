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
