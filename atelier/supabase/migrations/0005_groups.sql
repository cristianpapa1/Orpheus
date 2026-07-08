-- Atelier · migration 0005 — groups & group feeds
-- Phase 4: creators form groups by inviting each other. Two relationships:
-- MEMBER (can tag posts into the group) vs FOLLOWER (sees content, can't tag)
-- — structurally distinct tables, not a role flag.

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 60),
  slug text unique not null check (slug ~ '^[a-z0-9-]{3,60}$'),
  description text not null default '' check (char_length(description) <= 600),
  is_private boolean not null default false, -- privacy of the group feed
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (group_id, profile_id)
);

create table public.group_followers (
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, profile_id)
);

create table public.group_invites (
  group_id uuid not null references public.groups (id) on delete cascade,
  invitee_id uuid not null references public.profiles (id) on delete cascade,
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, invitee_id)
);

create table public.group_join_requests (
  group_id uuid not null references public.groups (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, requester_id)
);

create table public.post_groups (
  post_id uuid not null references public.posts (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, group_id)
);

create index post_groups_group_idx on public.post_groups (group_id);

-- ── RLS ──────────────────────────────────────────────────────────

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_followers enable row level security;
alter table public.group_invites enable row level security;
alter table public.group_join_requests enable row level security;
alter table public.post_groups enable row level security;

-- Groups are discoverable (private groups gate their FEED, not their card).
create policy "groups are viewable by everyone"
  on public.groups for select using (true);

create policy "signed-in users create groups as themselves"
  on public.groups for insert
  with check (auth.uid() = created_by);

create policy "owners update their groups"
  on public.groups for update
  using (exists (
    select 1 from public.group_members m
    where m.group_id = id and m.profile_id = auth.uid() and m.role = 'owner'
  ));

-- Membership is public (member lists render on group pages).
create policy "memberships are viewable by everyone"
  on public.group_members for select using (true);

-- Three legitimate paths into a group:
--   1. creator bootstraps their own owner row
--   2. an invitee accepts an invite (self-insert)
--   3. an owner approves a join request (inserts the requester's row)
create policy "creators bootstrap owner membership"
  on public.group_members for insert
  with check (
    profile_id = auth.uid()
    and role = 'owner'
    and exists (select 1 from public.groups g
                where g.id = group_id and g.created_by = auth.uid())
  );

create policy "invitees join via invite"
  on public.group_members for insert
  with check (
    profile_id = auth.uid()
    and role = 'member'
    and exists (select 1 from public.group_invites i
                where i.group_id = group_members.group_id
                  and i.invitee_id = auth.uid())
  );

create policy "owners admit approved requesters"
  on public.group_members for insert
  with check (
    role = 'member'
    and exists (select 1 from public.group_members m
                where m.group_id = group_members.group_id
                  and m.profile_id = auth.uid() and m.role = 'owner')
    and exists (select 1 from public.group_join_requests r
                where r.group_id = group_members.group_id
                  and r.requester_id = group_members.profile_id)
  );

create policy "members leave on their own"
  on public.group_members for delete
  using (profile_id = auth.uid());

-- Followers: public counts, self-managed rows.
create policy "group follows are viewable by everyone"
  on public.group_followers for select using (true);
create policy "users follow groups as themselves"
  on public.group_followers for insert with check (profile_id = auth.uid());
create policy "users unfollow groups as themselves"
  on public.group_followers for delete using (profile_id = auth.uid());

-- Invites: visible to the invitee and to group members; sent by members.
create policy "invites visible to invitee and members"
  on public.group_invites for select
  using (
    invitee_id = auth.uid()
    or exists (select 1 from public.group_members m
               where m.group_id = group_invites.group_id
                 and m.profile_id = auth.uid())
  );
create policy "members send invites as themselves"
  on public.group_invites for insert
  with check (
    inviter_id = auth.uid()
    and exists (select 1 from public.group_members m
                where m.group_id = group_invites.group_id
                  and m.profile_id = auth.uid())
  );
create policy "invitee or inviter removes an invite"
  on public.group_invites for delete
  using (invitee_id = auth.uid() or inviter_id = auth.uid());

-- Join requests: requester-created; visible to requester and members.
create policy "requests visible to requester and members"
  on public.group_join_requests for select
  using (
    requester_id = auth.uid()
    or exists (select 1 from public.group_members m
               where m.group_id = group_join_requests.group_id
                 and m.profile_id = auth.uid())
  );
create policy "users request to join as themselves"
  on public.group_join_requests for insert
  with check (requester_id = auth.uid());
create policy "requester withdraws or owner resolves"
  on public.group_join_requests for delete
  using (
    requester_id = auth.uid()
    or exists (select 1 from public.group_members m
               where m.group_id = group_join_requests.group_id
                 and m.profile_id = auth.uid() and m.role = 'owner')
  );

-- Post tags: public (feed markers); only the post's author tags, and only
-- into groups where the author is a MEMBER (followers can't tag — the
-- member/follower distinction, enforced at the database).
create policy "post tags are viewable by everyone"
  on public.post_groups for select using (true);

create policy "authors tag own posts into their groups"
  on public.post_groups for insert
  with check (
    exists (select 1 from public.posts p
            where p.id = post_id and p.author_id = auth.uid())
    and exists (select 1 from public.group_members m
                where m.group_id = post_groups.group_id
                  and m.profile_id = auth.uid())
  );

create policy "authors untag own posts"
  on public.post_groups for delete
  using (exists (select 1 from public.posts p
                 where p.id = post_id and p.author_id = auth.uid()));
