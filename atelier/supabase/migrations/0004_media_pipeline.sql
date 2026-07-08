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
