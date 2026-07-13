-- Atelier · migration 0019 — post topic tags + soft-delete (moderation audit)
-- tags: free-form topic tags (#woodfired, #poetry) for folksonomy discovery.
-- removed_at/removed_by: takedowns become reversible + audited instead of a
-- hard delete. Read paths exclude removed posts. Idempotent.

alter table public.posts
  add column if not exists tags text[] not null default '{}',
  add column if not exists removed_at timestamptz,
  add column if not exists removed_by uuid references public.profiles (id) on delete set null;

-- Feed/browse scans skip removed posts efficiently.
create index if not exists posts_live_created_idx
  on public.posts (created_at desc)
  where removed_at is null;

-- Tag containment lookups (/t/<tag>).
create index if not exists posts_tags_idx on public.posts using gin (tags);
