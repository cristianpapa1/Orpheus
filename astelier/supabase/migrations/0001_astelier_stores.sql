-- Astelier Phase B — stores.
-- One store per profile (v1). Shared Supabase project with Atelier: references
-- Atelier's profiles for ownership. Public-read (for the store page + Atelier's
-- "Shop at Astelier" link-back); the owner writes their own row.
-- Idempotent — safe to re-run.

create table if not exists public.astelier_stores (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null unique references public.profiles(id) on delete cascade,
  name        text not null,
  slug        text not null unique,
  description text not null default '',
  banner_path text,
  accent      text not null default 'red',
  school      text not null default 'bauhaus',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists astelier_stores_slug_idx on public.astelier_stores (slug);

alter table public.astelier_stores enable row level security;

-- Anyone may read an active store; the owner always sees their own (even inactive).
drop policy if exists astelier_stores_read on public.astelier_stores;
create policy astelier_stores_read on public.astelier_stores
  for select using (is_active = true or owner_id = auth.uid());

-- The owner manages only their own store.
drop policy if exists astelier_stores_insert on public.astelier_stores;
create policy astelier_stores_insert on public.astelier_stores
  for insert with check (owner_id = auth.uid());

drop policy if exists astelier_stores_update on public.astelier_stores;
create policy astelier_stores_update on public.astelier_stores
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists astelier_stores_delete on public.astelier_stores;
create policy astelier_stores_delete on public.astelier_stores
  for delete using (owner_id = auth.uid());
