-- Atelier · migration 0006 — private chat (Phase 5)
-- 1:1 direct messages using Supabase Realtime. RLS so only thread
-- participants can read/write. Thread rows are created deterministically
-- so the "message" action always knows which thread_id to use.

create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references public.profiles (id) on delete cascade,
  participant_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- A→B and B→A are the same thread — the insert trigger enforces ordering
  -- so one unique constraint catches both directions.
  constraint chat_threads_participants_check check (participant_a <> participant_b)
);

-- Enforce (A,B) uniqueness regardless of order: always store the smaller id
-- as participant_a so the PK catches duplicates in both directions.
create or replace function public.normalize_thread_participants()
returns trigger as $$
begin
  if new.participant_a > new.participant_b then
    new.participant_a := new.participant_b;
    new.participant_b := new.participant_a;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_chat_threads_normalize
  before insert on public.chat_threads
  for each row execute function public.normalize_thread_participants();

create unique index chat_threads_participants_uniq
  on public.chat_threads (least(participant_a, participant_b), greatest(participant_a, participant_b));

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index chat_messages_thread_idx on public.chat_messages (thread_id, created_at);

-- ── RLS ──────────────────────────────────────────────────────────

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

-- A user sees a thread when they are one of the two participants.
create policy "participants view their threads"
  on public.chat_threads for select
  using (auth.uid() in (participant_a, participant_b));

-- Either participant can create a thread (the trigger normalizes ordering).
create policy "participants create threads"
  on public.chat_threads for insert
  with check (auth.uid() in (participant_a, participant_b));

-- Messages are visible to thread participants only.
create policy "participants view thread messages"
  on public.chat_messages for select
  using (exists (
    select 1 from public.chat_threads t
    where t.id = thread_id
      and auth.uid() in (t.participant_a, t.participant_b)
  ));

-- A participant can insert their own messages into their threads.
create policy "participants send messages"
  on public.chat_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_threads t
      where t.id = thread_id
        and auth.uid() in (t.participant_a, t.participant_b)
    )
  );
