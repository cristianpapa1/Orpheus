-- Astelier Phase I — lightweight seller analytics: a view counter on stores and
-- products, bumped through a SECURITY DEFINER function so anonymous visitors can
-- increment (only increment — no other access). Idempotent.
-- The app degrades gracefully until this is applied (counts read as 0, bumps no-op).

alter table public.astelier_stores   add column if not exists view_count integer not null default 0;
alter table public.astelier_products add column if not exists view_count integer not null default 0;

create or replace function public.astelier_bump_view(p_kind text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind = 'product' then
    update public.astelier_products set view_count = view_count + 1 where id = p_id;
  elsif p_kind = 'store' then
    update public.astelier_stores set view_count = view_count + 1 where id = p_id;
  end if;
end;
$$;

grant execute on function public.astelier_bump_view(text, uuid) to anon, authenticated;
