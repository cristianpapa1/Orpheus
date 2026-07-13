-- Atelier · migration 0021 — quality stamps (trusted community reviewers)
-- Proven members earn a quality stamp and can then flag low-quality work for
-- admin review. Idempotent.

alter table public.profiles
  add column if not exists quality_stamp boolean not null default false,
  add column if not exists quality_stamped_at timestamptz,
  add column if not exists quality_stamped_by uuid references public.profiles (id) on delete set null;

-- reports.reason gains 'quality'
alter table public.reports drop constraint if exists reports_reason_check;
alter table public.reports add constraint reports_reason_check
  check (reason in ('spam', 'harassment', 'stolen_work', 'illegal', 'quality', 'other'));

-- notifications.type gains 'quality_stamp' (notify the user when granted)
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('favorite', 'share', 'mention', 'comment', 'claim_approved', 'follow', 'quality_stamp'));

-- Candidates for a quality stamp — admin-gated (returns empty for non-admins).
-- Bar: onboarded ≥30d, ≥5 live posts, ≥50 mutual followers, not yet stamped.
create or replace function public.quality_candidates()
returns table (
  id uuid,
  handle text,
  display_name text,
  posts bigint,
  mutuals bigint,
  onboarded_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select c.id, c.handle, c.display_name, c.posts, c.mutuals, c.onboarded_at
  from (
    select
      p.id, p.handle, p.display_name, p.onboarded_at,
      (select count(*) from public.posts po
         where po.author_id = p.id and po.removed_at is null) as posts,
      (select count(*) from public.follows a
         where a.followee_id = p.id
           and exists (
             select 1 from public.follows b
             where b.follower_id = p.id and b.followee_id = a.follower_id
           )) as mutuals
    from public.profiles p
    where coalesce(p.quality_stamp, false) = false
      and p.onboarded_at is not null
      and p.onboarded_at <= now() - interval '30 days'
      and exists (
        select 1 from public.profiles adm
        where adm.id = auth.uid() and adm.is_admin
      )
  ) c
  where c.posts >= 5 and c.mutuals >= 50
  order by c.mutuals desc, c.posts desc;
$$;

grant execute on function public.quality_candidates() to authenticated;
