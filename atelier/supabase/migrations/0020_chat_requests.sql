-- Atelier · migration 0020 — chat contact requests
-- A first message from someone you don't mutually follow arrives as a
-- "contact request": the recipient reads it and accepts (→ main Messages) or
-- dismisses. requested_by = who initiated a non-mutual thread; accepted_at =
-- when the recipient accepted (null = still pending). Idempotent.

alter table public.chat_threads
  add column if not exists requested_by uuid references public.profiles (id) on delete set null,
  add column if not exists accepted_at timestamptz;

-- Accept (recipient sets accepted_at). App enforces recipient-only; RLS allows
-- either participant to update their own thread row.
drop policy if exists "participants update their threads" on public.chat_threads;
create policy "participants update their threads"
  on public.chat_threads for update
  using (auth.uid() in (participant_a, participant_b));

-- Dismiss (delete the thread) — either participant may remove their thread.
drop policy if exists "participants delete their threads" on public.chat_threads;
create policy "participants delete their threads"
  on public.chat_threads for delete
  using (auth.uid() in (participant_a, participant_b));
