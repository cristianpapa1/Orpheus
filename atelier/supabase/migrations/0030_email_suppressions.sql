-- Atelier · migration 0030 — email suppression list (Resend webhook)
--
-- Hard bounces and spam complaints reported by Resend (via /api/resend/webhook)
-- land here so our transactional sender (lib/email/resend.ts) skips them —
-- protecting sender reputation and deliverability. Written ONLY by the service
-- role (the webhook handler); RLS on with no policies = no client access.
--
-- Idempotent — safe to re-run.

create table if not exists public.email_suppressions (
  email text primary key,
  reason text not null check (reason in ('bounce', 'complaint', 'manual')),
  detail text not null default '',
  created_at timestamptz not null default now()
);

alter table public.email_suppressions enable row level security;
-- No policies intentionally: only the service role (which bypasses RLS) reads/writes.
