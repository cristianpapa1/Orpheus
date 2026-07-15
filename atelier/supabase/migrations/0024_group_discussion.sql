-- Phase 7 — group discussion board (Twitter/Reddit-style: top-level messages +
-- one level of replies). The group owner chooses who can read and who can post:
--   discussion_read  : public | members
--   discussion_mode  : open      → members post & reply (forum)
--                      announce  → owners post top-level, members reply
--                      broadcast → owners post only, members read (announcements)
-- Idempotent.

alter table public.groups
  add column if not exists discussion_read text not null default 'members'
    check (discussion_read in ('public', 'members'));
alter table public.groups
  add column if not exists discussion_mode text not null default 'open'
    check (discussion_mode in ('open', 'announce', 'broadcast'));

create table if not exists public.group_messages (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  parent_id  uuid references public.group_messages(id) on delete cascade, -- null = top-level
  body       text not null check (char_length(body) between 1 and 4000),
  removed_at timestamptz,
  removed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists group_messages_group_idx on public.group_messages (group_id, created_at desc);
create index if not exists group_messages_parent_idx on public.group_messages (parent_id);

alter table public.group_messages enable row level security;

-- READ: public discussions are open to all; otherwise members only. Removed hidden.
drop policy if exists group_messages_read on public.group_messages;
create policy group_messages_read on public.group_messages for select using (
  removed_at is null
  and (
    exists (select 1 from public.groups g where g.id = group_id and g.discussion_read = 'public')
    or exists (
      select 1 from public.group_members m
      where m.group_id = group_messages.group_id and m.profile_id = auth.uid()
    )
  )
);

-- INSERT: author is self, must be a member, and the group's mode must allow it.
-- Owners may always post; the mode gates member writes (top-level vs reply).
drop policy if exists group_messages_insert on public.group_messages;
create policy group_messages_insert on public.group_messages for insert with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.group_members m
    where m.group_id = group_messages.group_id and m.profile_id = auth.uid()
  )
  and (
    exists (
      select 1 from public.group_members m
      where m.group_id = group_messages.group_id and m.profile_id = auth.uid() and m.role = 'owner'
    )
    or exists (
      select 1 from public.groups g
      where g.id = group_id
        and (g.discussion_mode = 'open'
             or (g.discussion_mode = 'announce' and parent_id is not null))
    )
  )
);

-- UPDATE (soft-delete): the author or a group owner.
drop policy if exists group_messages_update on public.group_messages;
create policy group_messages_update on public.group_messages for update using (
  author_id = auth.uid()
  or exists (
    select 1 from public.group_members m
    where m.group_id = group_messages.group_id and m.profile_id = auth.uid() and m.role = 'owner'
  )
);

-- notifications: allow the group_message type
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('favorite', 'share', 'mention', 'comment', 'claim_approved', 'follow', 'quality_stamp', 'group_message'));
