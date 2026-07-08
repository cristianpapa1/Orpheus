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
set handle = 'ines', bio = 'Analogue photographer. Lisbon.'
where id = '00000000-0000-4000-a000-000000000001';

update public.profiles
set handle = 'theo', bio = 'Ceramics & woodwork. Berlin.'
where id = '00000000-0000-4000-a000-000000000002';
