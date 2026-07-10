# Atelier — Launch Checklist (Phase 9)

Status legend: ✅ done in code · 🔑 blocked on credentials · 👤 needs a human decision

## Credentials & environment (the single biggest unlock)

- 🔑 Supabase project: URL + anon key → `.env.local`; run `bunx supabase db push` (migrations 0001–0010), then seed
- 🔑 `SUPABASE_SERVICE_ROLE_KEY` (webhook-only; never client-side)
- 🔑 Stripe: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (point the webhook at `/api/stripe/webhook`)
- 🔑 Google OAuth app for Supabase Auth provider
- 👤 Resend key + domain for ATELIER-EMAIL (appeal emails, event reminders) — post-launch OK
- 🔑 Run the 10 `[DEFERRED-VERIFY]` ISAs criteria once keys exist (grep `DEFERRED-VERIFY` in ../ISA.md)

## Trust & safety (Phase 9)

- ✅ Reporting on posts + profiles (5 reasons, detail, ≤20/day per user)
- ✅ Blocking (feed exclusion) — extend to chat/groups surfaces as usage data arrives
- ✅ Moderation queue at `/admin/reports` (open → reviewed/dismissed/actioned)
- ✅ Advisory rate limits: 20 posts/h, 120 messages/h, 20 reports/day
- 👤 Hard rate limiting & WAF at the edge (Vercel/Cloudflare) — advisory checks are not DDoS defense
- 👤 Moderation rota: who reviews the queue, response-time target, escalation path
- 👤 Legal review of /terms and /privacy drafts

## Backups & data

- 👤 Enable Supabase PITR (point-in-time recovery) on the paid tier before launch
- 👤 Weekly logical dump to separate storage (pg_dump via scheduled job)
- ✅ Deletion path documented in /privacy; cascade deletes verified in schema

## Monitoring & analytics (privacy-respecting, non-ad)

- ✅ Zero tracking scripts in the app (probed: no gtag/posthog/plausible/pixel)
- 👤 Choose server-side/aggregate analytics only: self-hosted Plausible or Vercel
  Web Analytics (cookieless) — never client fingerprinting
- 👤 Uptime monitor on `/` and `/api/stripe/webhook`; Supabase + Stripe dashboards for errors

## Performance posture

- ✅ Display variants (480/960/1600 WebP) + srcset/sizes; blur-up; lazy + async decoding
- ✅ Feed/discovery capped queries with covering indexes; no N+1 (batched group markers)
- 👤 CDN swap for variants when traffic warrants (documented in migration 0004 — URL change only)
- 👤 Lighthouse pass on real devices post-deploy (target: LCP < 2.5s on 4G)

## Soft-launch plan

1. Deploy web (Vercel) + Supabase Cloud; run all DEFERRED-VERIFY criteria
2. Invite 20–50 creators by hand (groups thrive on density, not scale)
3. Watch: moderation queue volume, donation appeal honesty, feed latency
4. Fix the sharp edges the first cohort hits; only then open registration
5. Backlogs on deck: ATELIER-P5.1 (chat realtime/image/read-state), ATELIER-EMAIL, mobile bar + Expo (see plan in ISA/summary)
