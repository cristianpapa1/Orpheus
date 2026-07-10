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
