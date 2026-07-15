-- Feed Phase 6 — multi-image (carousel) posts. `images` is an array of
-- {variants:[{width,path}], blur}; the cover (images[0]) also fills the existing
-- image_path/variants/blur_data, so single-image posts and every current read
-- keep working. Idempotent.

alter table public.posts add column if not exists images jsonb not null default '[]'::jsonb;
