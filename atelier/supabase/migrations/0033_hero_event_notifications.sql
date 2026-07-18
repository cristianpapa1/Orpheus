-- Atelier · migration 0033 — notifications for Heroes & event joins
--
-- Two new notification types close the Heroes social loop:
--   • hero_like   — someone liked your Hero  (subject: the hero)
--   • event_join  — someone is going to your event  (subject: the event)
--
-- Adds the two types and two subject kinds (hero, event) to the existing
-- notifications check constraints. Idempotent — safe to re-run.

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'favorite', 'share', 'mention', 'comment', 'claim_approved', 'follow',
    'quality_stamp', 'group_message', 'creator_approved', 'creator_rejected',
    'curated', 'hero_like', 'event_join'
  ));

alter table public.notifications drop constraint if exists notifications_subject_type_check;
alter table public.notifications add constraint notifications_subject_type_check
  check (subject_type in ('post', 'profile', 'hero', 'event'));
