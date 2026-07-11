-- Atelier · migration 0014 — claim a seeded institution profile
-- Seeded institutions (0013 Wave C) are community/unofficial until a real owner
-- claims them. A claim is a request an admin approves; approval hands the
-- profile to the claimant via `managed_by` (the profile keeps its identity,
-- handle, posts, and groups — no primary-key surgery).

alter table public.profiles
  add column is_seed boolean not null default false,
  add column claimed_at timestamptz,
  add column managed_by uuid references public.profiles (id) on delete set null;

-- Mark the profiles the seeding script created (auth email @seed.atelier.local).
update public.profiles set is_seed = true
  where id in (select id from auth.users where email like '%@seed.atelier.local');

-- Managers may edit the profile they manage, in addition to the owner.
-- (The app only ever writes display/identity columns through this path.)
create policy "managers update managed profiles"
  on public.profiles for update
  using (auth.uid() = managed_by);

create table public.profile_claims (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  claimant_id uuid not null references public.profiles (id) on delete cascade,
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'revoked')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null,
  primary key (profile_id, claimant_id)
);

create index profile_claims_status_idx on public.profile_claims (status);

alter table public.profile_claims enable row level security;

-- The claimant sees their own claims; admins see all.
create policy "claimants and admins read claims"
  on public.profile_claims for select
  using (
    claimant_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- A signed-in user may request to claim a SEED, UNCLAIMED profile as themselves.
create policy "users request claims on seed profiles"
  on public.profile_claims for insert
  with check (
    claimant_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = profile_id and p.is_seed and p.claimed_at is null
    )
  );

-- Only admins resolve (approve/reject) claims.
create policy "admins resolve claims"
  on public.profile_claims for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- The claimant may withdraw their own claim; admins may remove any.
create policy "claimant withdraws or admin removes"
  on public.profile_claims for delete
  using (
    claimant_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );
