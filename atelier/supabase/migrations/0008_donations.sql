-- Atelier · migration 0008 — donations & admin appeals
-- Phase 7: the ONLY money flow into the platform. Voluntary donations,
-- recorded exclusively by the Stripe webhook (service role) — there is
-- deliberately NO client insert policy on donations. Appeals are manual,
-- admin-triggered, and never coupled to feed visibility.

alter table public.profiles
  add column is_admin boolean not null default false;

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 80),
  message text not null check (char_length(message) <= 600),
  goal_cents int check (goal_cents is null or goal_cents > 0),
  audience text not null default 'everyone'
    check (audience in ('everyone', 'past_donors', 'active_users')),
  active boolean not null default false,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references public.profiles (id) on delete set null,
  donor_email text,
  amount_cents int not null check (amount_cents > 0),
  currency text not null default 'eur' check (char_length(currency) = 3),
  kind text not null check (kind in ('one_off', 'recurring')),
  status text not null default 'succeeded'
    check (status in ('pending', 'succeeded', 'refunded', 'canceled')),
  stripe_session_id text unique,
  stripe_subscription_id text,
  appeal_id uuid references public.appeals (id) on delete set null,
  created_at timestamptz not null default now()
);

create index donations_appeal_idx on public.donations (appeal_id);
create index donations_created_idx on public.donations (created_at desc);

alter table public.appeals enable row level security;
alter table public.donations enable row level security;

-- Active appeals are public (they power the banner). Full list: admins.
create policy "active appeals are viewable by everyone"
  on public.appeals for select
  using (
    active = true
    or exists (select 1 from public.profiles p
               where p.id = auth.uid() and p.is_admin)
  );

create policy "admins create appeals"
  on public.appeals for insert
  with check (exists (select 1 from public.profiles p
                      where p.id = auth.uid() and p.is_admin));

create policy "admins update appeals"
  on public.appeals for update
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.is_admin));

-- Donations: donors see their own; admins see the ledger.
-- NO insert/update policy — only the service-role webhook writes rows.
create policy "donors and admins read donations"
  on public.donations for select
  using (
    donor_id = auth.uid()
    or exists (select 1 from public.profiles p
               where p.id = auth.uid() and p.is_admin)
  );
