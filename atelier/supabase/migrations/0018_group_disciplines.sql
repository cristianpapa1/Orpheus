-- Atelier · migration 0018 — group disciplines
-- Groups declare which disciplines they're for (painters, journalists,
-- woodworkers, sculptors…) so /groups can be filtered by discipline, not just
-- searched by name. Tags use the discipline vocabulary (cat:* / sub:*).
-- Idempotent.

alter table public.groups
  add column if not exists interests text[] not null default '{}';
