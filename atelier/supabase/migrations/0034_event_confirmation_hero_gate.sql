-- Atelier · migration 0034 — event attendee confirmation + block, Heroes gated to a confirmed event
--
-- Builds an organizer layer on top of RSVP (0032's event_participants):
--   • CONFIRM — the organizer vouches an attendee actually came (a manual ticket
--     check today). Only CONFIRMED attendees may post a Hero tied to that event.
--   • BLOCK   — the organizer bars a specific attendee from tying Heroes to the
--     event. Anti-abuse: stops someone riding the event's name by "keep posting
--     as if part of the event". A block overrides confirmation.
-- RSVP ("I'm going", 0032) is UNTOUCHED — still instant + public (the "N going"
-- count). Confirmation/block is a separate, organizer-only capability.
--
-- And the core pivot: every Hero now REQUIRES an event, and its author must be a
-- confirmed (not blocked) attendee — or the event owner. So Heroes can no longer
-- carry unrelated content; they are always tied to a real event you took part in.
--
-- "Owner" of an event = the event's own profile OR the user who manages that
-- (institution) profile via profiles.managed_by — so institution events, run by
-- a manager, confirm/block correctly.
--
-- Idempotent — safe to re-run.

-- ── 1) ownership helper ──────────────────────────────────────────
create or replace function public.is_event_owner(uid uuid, ev uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    join public.profiles p on p.id = e.profile_id
    where e.id = ev
      and (e.profile_id = uid or p.managed_by = uid)
  );
$$;

-- ── 2) confirmation + block columns on the RSVP row ──────────────
alter table public.event_participants
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid references public.profiles (id) on delete set null,
  add column if not exists blocked_at   timestamptz,
  add column if not exists blocked_by   uuid references public.profiles (id) on delete set null;

create index if not exists event_participants_confirmed_idx
  on public.event_participants (event_id)
  where confirmed_at is not null;

-- The event owner may update participant rows for their events (confirm/block).
-- Members still cannot self-confirm: 0032 only lets them insert/delete their own
-- RSVP; this UPDATE path is scoped strictly to the event owner.
drop policy if exists "event owners manage participants" on public.event_participants;
create policy "event owners manage participants"
  on public.event_participants for update
  using (public.is_event_owner(auth.uid(), event_id))
  with check (public.is_event_owner(auth.uid(), event_id));

-- ── 3) the Hero gate — single source of truth ────────────────────
-- True if the user OWNS the event, or is a CONFIRMED and NOT-BLOCKED attendee.
create or replace function public.is_event_confirmed(uid uuid, ev uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_event_owner(uid, ev)
    or exists (
      select 1
      from public.event_participants p
      where p.event_id = ev
        and p.profile_id = uid
        and p.confirmed_at is not null
        and p.blocked_at is null
    );
$$;

-- ── 4) Heroes now REQUIRE a confirmed event ──────────────────────
-- Clear any legacy event-less Heroes (non-compliant now; they are ephemeral and
-- >24h-old test rows are already expired/invisible), then require an event and
-- cascade Heroes if the event is removed.
delete from public.heroes where event_id is null;

alter table public.heroes drop constraint if exists heroes_event_id_fkey;
alter table public.heroes
  add constraint heroes_event_id_fkey
  foreign key (event_id) references public.events (id) on delete cascade;
alter table public.heroes alter column event_id set not null;

-- Replace the open "any member posts" insert policy with the event gate.
drop policy if exists "members post their own heroes" on public.heroes;
drop policy if exists "members post heroes for confirmed events" on public.heroes;
create policy "members post heroes for confirmed events"
  on public.heroes for insert
  with check (
    author_id = auth.uid()
    and event_id is not null
    and public.is_event_confirmed(auth.uid(), event_id)
  );

-- The event owner can also remove a Hero tied to their event (anti-abuse),
-- on top of the author's + an admin's existing right.
drop policy if exists "authors or admins delete heroes" on public.heroes;
drop policy if exists "authors admins or event owners delete heroes" on public.heroes;
create policy "authors admins or event owners delete heroes"
  on public.heroes for delete using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
    or public.is_event_owner(auth.uid(), event_id)
  );

-- ── 5) notification: your attendance was confirmed ───────────────
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'favorite', 'share', 'mention', 'comment', 'claim_approved', 'follow',
    'quality_stamp', 'group_message', 'creator_approved', 'creator_rejected',
    'curated', 'hero_like', 'event_join', 'event_confirmed'
  ));
