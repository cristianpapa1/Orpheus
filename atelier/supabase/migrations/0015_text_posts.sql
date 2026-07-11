-- Atelier · migration 0015 — text posts (poems, paragraphs)
-- A text post has no image: its work IS the words. image_path becomes
-- nullable, a `body` column carries the text, and the media constraints gain
-- a 'text' branch. Existing rows (image/video/audio) keep body = null and an
-- image_path, so they satisfy the tightened constraint unchanged.

alter table public.posts alter column image_path drop not null;

alter table public.posts
  add column body text check (body is null or char_length(body) <= 4000);

-- media_type gains 'text'
alter table public.posts drop constraint posts_media_type_check;
alter table public.posts add constraint posts_media_type_check
  check (media_type in ('image', 'video', 'audio', 'text'));

-- Media consistency, extended: text ⇒ no image/media/duration, body required;
-- every non-text kind ⇒ an image_path and no body.
alter table public.posts drop constraint posts_media_duration_check;
alter table public.posts add constraint posts_media_duration_check check (
  (media_type = 'image' and media_path is null and duration_seconds is null
     and image_path is not null and body is null)
  or (media_type = 'video' and media_path is not null and duration_seconds <= 120
     and image_path is not null and body is null)
  or (media_type = 'audio' and media_path is not null
     and image_path is not null and body is null)
  or (media_type = 'text' and media_path is null and duration_seconds is null
     and image_path is null and body is not null)
);
