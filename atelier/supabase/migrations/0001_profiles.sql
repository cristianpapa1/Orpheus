-- Atelier · migration 0001 — profiles
-- Every auth user gets a profile row. The `layout` JSONB column is the
-- seed of Phase 1's user-constructed windowed profile.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique check (handle ~ '^[a-z0-9_]{3,30}$'),
  display_name text,
  avatar_url text,
  bio text,
  layout jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profiles are public spaces: anyone can view.
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Only the owner writes their own profile.
create policy "users insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile when a user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
