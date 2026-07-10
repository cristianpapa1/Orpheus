-- Atelier · seed data (local development only)
-- Run against a local Supabase stack: `bunx supabase db reset` applies
-- migrations then this seed.

-- Two demo creators. Inserting into auth.users is acceptable in local seeds;
-- the on_auth_user_created trigger creates their profile rows.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ines@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Inês Almeida"}'),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'theo@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Theo Brandt"}')
on conflict (id) do nothing;

update public.profiles
set is_admin = true, school = 'de-stijl'
where id = '00000000-0000-4000-a000-000000000001';

update public.profiles
set school = 'swiss'
where id = '00000000-0000-4000-a000-000000000002';

update public.profiles
set handle = 'ines',
    bio = 'Analogue photographer. Lisbon.',
    links = '[{"label":"Portfolio","url":"https://example.com/ines"},{"label":"Darkroom notes","url":"https://example.com/ines/notes"}]'::jsonb,
    layout = '{"version":1,"blocks":[{"id":"bio","type":"bio","x":0,"y":0,"w":5,"h":4},{"id":"gallery","type":"gallery","x":5,"y":0,"w":7,"h":6},{"id":"links","type":"links","x":0,"y":4,"w":5,"h":2},{"id":"events","type":"events","x":0,"y":6,"w":12,"h":2},{"id":"jobs","type":"jobs","x":0,"y":8,"w":12,"h":3}]}'::jsonb
where id = '00000000-0000-4000-a000-000000000001';

update public.profiles
set handle = 'theo',
    bio = 'Ceramics & woodwork. Berlin.',
    links = '[{"label":"Studio","url":"https://example.com/theo"}]'::jsonb
where id = '00000000-0000-4000-a000-000000000002';

-- Theo follows Inês.
insert into public.follows (follower_id, followee_id)
values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000001')
on conflict do nothing;

-- Demo groups (mirror src/lib/groups/demo.ts).
insert into public.groups (id, name, slug, description, is_private, created_by)
values
  ('10000000-0000-4000-a000-000000000001', 'Analogue Circle', 'analogue-circle', 'Film, darkrooms, and slow process. Scans welcome — phone snaps of prints too.', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000002', 'Clay & Wood', 'clay-wood', 'A quiet room for people who fire and carve. Private feed — members share works in progress.', true, '00000000-0000-4000-a000-000000000002')
on conflict (id) do nothing;

insert into public.group_members (group_id, profile_id, role)
values
  ('10000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000001', 'owner'),
  ('10000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000002', 'member'),
  ('10000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000002', 'owner')
on conflict do nothing;

-- Demo job posts (mirror src/lib/jobs/demo.ts).
insert into public.job_posts (profile_id, title, discipline, description, location, work_mode, compensation, apply_url, status)
values
  ('00000000-0000-4000-a000-000000000002', 'Studio assistant — ceramics', 'handmade', 'Two days a week in the Wedding studio.', 'Berlin', 'on_site', '€16/h', null, 'open'),
  ('00000000-0000-4000-a000-000000000001', 'Darkroom printer for an edition run', 'photography', '30 silver gelatin prints, 40×50.', 'Lisbon', 'on_site', '€400 per edition', 'https://example.com/apply/darkroom', 'open'),
  ('00000000-0000-4000-a000-000000000001', 'Product photography for a ceramics shop', 'photography', 'Filled — thanks everyone.', '', 'remote', 'Negotiable', null, 'filled')
on conflict do nothing;
