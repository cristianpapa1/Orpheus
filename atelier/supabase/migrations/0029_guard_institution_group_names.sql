-- Atelier · migration 0029 — protect institution names in group names
--
-- A group whose name contains an institution's name may only be created by that
-- institution (or its manager). Mirrors the app-layer check in createGroup — this
-- is the DB backstop so a direct API insert can't impersonate "The New Yorker",
-- "Tate", etc. Whole-word/phrase match (boundary-aware) so incidental letters are
-- safe ("estate" won't trip "Tate"). Service role / SQL editor are trusted (the
-- seed creates the "<Institution> — Community" groups as the institution itself).
--
-- Idempotent — safe to re-run.

create or replace function public.guard_institution_group_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inst record;
  full_name text;
  short_name text;
begin
  -- Only gate end users; service role and direct SQL are trusted.
  if auth.role() is distinct from 'authenticated' then
    return new;
  end if;

  for inst in
    select id, display_name, managed_by
    from public.profiles
    where account_type = 'institution'
      and char_length(coalesce(display_name, '')) >= 3
  loop
    -- The institution itself, or its manager, may use the name.
    if new.created_by = inst.id
       or (inst.managed_by is not null and new.created_by = inst.managed_by) then
      continue;
    end if;

    full_name := lower(inst.display_name);
    short_name := regexp_replace(full_name, '^(the|a|an|le|la|les)\s+', '');

    if new.name ~* ('(^|[^[:alnum:]])' || full_name || '([^[:alnum:]]|$)')
       or (
         char_length(short_name) >= 5
         and short_name <> full_name
         and new.name ~* ('(^|[^[:alnum:]])' || short_name || '([^[:alnum:]]|$)')
       ) then
      raise exception
        'Group name uses the protected institution name "%". Only that institution can create it.',
        inst.display_name
        using errcode = 'check_violation';
    end if;
  end loop;

  return new;
end $$;

drop trigger if exists guard_institution_group_name on public.groups;
create trigger guard_institution_group_name
  before insert on public.groups
  for each row execute function public.guard_institution_group_name();
