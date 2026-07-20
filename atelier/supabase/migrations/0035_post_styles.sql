-- Atelier · migration 0035 — post styles (up to 3), the taxonomy upgrade
--
-- The taxonomy grew from 8 categories + one optional "subcategory" to ~32
-- categories each with a rich style list, and a work now carries UP TO THREE
-- styles (secondary metadata for discovery + AI recommendations) instead of a
-- single subcategory. This adds `posts.styles text[]` and backfills it from the
-- old single `subcategory` so nothing is lost. `subcategory` is kept (read-only
-- back-compat) — deploy-safe: reads that don't yet know about `styles` still work.
--
-- Idempotent — safe to re-run.

alter table public.posts
  add column if not exists styles text[] not null default '{}';

-- Backfill: a post's old single subcategory becomes its first style.
update public.posts
  set styles = array[subcategory]
  where subcategory is not null
    and subcategory <> ''
    and (styles is null or cardinality(styles) = 0);

-- GIN index for "posts with style X" discovery/filter queries.
create index if not exists posts_styles_idx on public.posts using gin (styles);
