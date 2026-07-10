-- Atelier · migration 0012 — fix chat thread normalization (live-verify find)
-- The 0006 trigger swapped participants without a temp variable, so when
-- participant_a > participant_b BOTH columns became participant_b and RLS
-- rejected the insert. Thread creation failed for ~half of all user pairs.

create or replace function public.normalize_thread_participants()
returns trigger as $$
declare
  tmp uuid;
begin
  if new.participant_a > new.participant_b then
    tmp := new.participant_a;
    new.participant_a := new.participant_b;
    new.participant_b := tmp;
  end if;
  return new;
end;
$$ language plpgsql security definer;
