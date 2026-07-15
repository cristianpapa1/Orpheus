-- Astelier Phase C — products. Belong to a store; reuse Atelier's discipline
-- taxonomy. external_url carries the seller's own shop link (Fulfilment I,
-- link-out). Idempotent — safe to re-run.

create table if not exists public.astelier_products (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.astelier_stores(id) on delete cascade,
  title        text not null,
  description  text not null default '',
  price_cents  integer not null default 0 check (price_cents >= 0),
  currency     text not null default 'usd',
  images       jsonb not null default '[]'::jsonb,   -- array of media-bucket paths
  disciplines  text[] not null default '{}',          -- reuse taxonomy: cat:* / sub:*
  external_url text,                                   -- link-out fulfilment
  status       text not null default 'draft',          -- draft | live | sold_out
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists astelier_products_store_idx on public.astelier_products (store_id);
create index if not exists astelier_products_status_idx on public.astelier_products (status);

alter table public.astelier_products enable row level security;

-- Anyone reads a LIVE product; the store owner reads all of their own.
drop policy if exists astelier_products_read on public.astelier_products;
create policy astelier_products_read on public.astelier_products
  for select using (
    status = 'live'
    or exists (
      select 1 from public.astelier_stores s
      where s.id = astelier_products.store_id and s.owner_id = auth.uid()
    )
  );

-- Only the owning store's owner may write.
drop policy if exists astelier_products_write on public.astelier_products;
create policy astelier_products_write on public.astelier_products
  for all
  using (
    exists (
      select 1 from public.astelier_stores s
      where s.id = astelier_products.store_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.astelier_stores s
      where s.id = astelier_products.store_id and s.owner_id = auth.uid()
    )
  );
