# Phase 15 — Quality stamps (trusted community reviewers)

> Source: user session 2026-07-11. A trust tier: proven members earn a "quality
> stamp" and, in return, can flag low-quality posts/profiles for admin review.

## The idea
- A new **Quality** report reason. Only a **quality-stamped** user may file it —
  so quality flags come from trusted members, not everyone.
- A user becomes eligible for a stamp when ALL hold:
  - **onboarded ≥ 30 days ago**,
  - **≥ 5 posts** (live, not removed),
  - **≥ 50 mutual followers** (they follow each other).
- Eligible profiles surface in an **admin queue** (`/admin/quality`). The admin
  reviews the profile and **grants** the stamp — the user becomes a "true member,"
  gets a **Quality ✓ badge**, is notified, and unlocks quality-reporting.

## Data (migration 0021)
- `profiles.quality_stamp boolean default false`, `quality_stamped_at timestamptz`,
  `quality_stamped_by uuid`.
- `reports.reason` check gains `'quality'`.
- `notifications.type` check gains `'quality_stamp'` (notify the user on grant).
- SQL function `quality_candidates()` (admin-gated, security definer): returns
  profiles meeting the 30d / 5-post / 50-mutual bar and not yet stamped, with counts.

## Enforcement
- `createReport`: a `'quality'` reason is only accepted from a quality-stamped
  reporter (server-side gate); the UI also hides the option for non-stamped users.
- Granting is admin-only (service role), like claims/takedowns.

## Surfaces
- **/admin/quality**: candidate list (posts, mutual-followers, days) + Grant; and
  the current stamped members. Linked from the admin console.
- **Report UI** (post Act menu + profile ReportControl): shows **Quality** only to
  stamped viewers.
- **Public profile**: **Quality ✓** badge for stamped users (distinct from the
  institution Verified badge).

## Deploy-safety
All reads defensive (stamp status / candidates → off when 0021 absent), so the
quality-report path only opens once 0021 exists AND a user is stamped. Deploy
precedes migration safely.

## Future (not in 15.0)
- Auto-notify admins when a profile crosses the threshold (needs a cron/trigger;
  for now the /admin/quality queue is pull-based).
- Quality reports could feed a per-post quality score; repeated quality flags →
  reduced reach or a review flag (careful: keep "no algorithm" principle intact —
  this is moderation signal, not ranking).
- Revoke a stamp (mirror the claim revoke).
