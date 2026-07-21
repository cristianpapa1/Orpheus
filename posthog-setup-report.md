<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep server-side analytics integration for the Atelier Next.js 16 application. A new `posthog-node` singleton (`atelier/src/lib/analytics/posthog.ts`) was created and wired into 7 server action / route handler files, covering the full user lifecycle from sign-in through content publishing, social interactions, and donations. All captures use `flushAt: 1` / `flushInterval: 0` and `await ph.flush()` to ensure events are reliably sent before each short-lived Next.js action exits. Environment variables (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`) were written to `atelier/.env.local`. The existing client-side `Analytics.tsx` component was left untouched.

| Event name | Description | File |
|---|---|---|
| `user_signed_in` | User verified email OTP and signed in | `atelier/src/app/login/actions.ts` |
| `onboarding_completed` | New user finished first-time profile setup | `atelier/src/app/onboarding/actions.ts` |
| `creator_application_submitted` | User submitted a creator application | `atelier/src/app/(shell)/creator/apply/actions.ts` |
| `post_published` | Creator published a new post (any media type) | `atelier/src/app/(shell)/post/actions.ts` |
| `post_favorited` | User saved a post to favorites | `atelier/src/app/(shell)/post/interactions.ts` |
| `post_curated` | Curator reposted another maker's work | `atelier/src/app/(shell)/post/interactions.ts` |
| `post_shared_to_chat` | User sent a post as a direct chat message | `atelier/src/app/(shell)/post/interactions.ts` |
| `donation_checkout_started` | User initiated a Stripe Checkout session | `atelier/src/app/donate/actions.ts` |
| `donation_completed` | Stripe webhook confirmed a successful donation | `atelier/src/app/api/stripe/webhook/route.ts` |
| `hero_published` | Confirmed event attendee posted a Hero video | `atelier/src/app/(shell)/heroes/actions.ts` |
| `hero_liked` | User liked a Hero video | `atelier/src/app/(shell)/heroes/actions.ts` |
| `group_created` | User created a new group | `atelier/src/app/(shell)/groups/actions.ts` |
| `group_joined` | User accepted a group invite and joined | `atelier/src/app/(shell)/groups/actions.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/522265/dashboard/1882525)
- [User sign-ins (wizard)](https://us.posthog.com/project/522265/insights/fctqAghT)
- [Onboarding funnel (wizard)](https://us.posthog.com/project/522265/insights/Gzz1VXvi)
- [Posts published by media type (wizard)](https://us.posthog.com/project/522265/insights/lEBFYXY9)
- [Donation funnel (wizard)](https://us.posthog.com/project/522265/insights/7x6xsBYH)
- [Creator applications (wizard)](https://us.posthog.com/project/522265/insights/RCmAU4cv)

## Verify before merging

- [ ] Run a full production build (`bun run build` inside `atelier/`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` (or your monorepo bootstrap scripts) so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — the current `identify` call only fires in `verifyEmailCode` (OTP flow). Users who sign in via Google OAuth or magic link (the `/auth/callback` route) are not identified server-side yet; add a matching `identify` + `user_signed_in` capture there if you want complete coverage.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-javascript_node/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
