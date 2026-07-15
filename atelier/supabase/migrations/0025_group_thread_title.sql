-- Phase 7.1 — thread pages. Top-level discussion messages gain an optional
-- subject/title, so the group board can list conversations Reddit-style and each
-- opens on its own page. Replies leave title null. Idempotent.

alter table public.group_messages
  add column if not exists title text check (title is null or char_length(title) <= 140);
