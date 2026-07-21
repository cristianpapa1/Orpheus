# Atelier — Phased Build Plan

> **Working name:** *Atelier* (placeholder — rename freely).
> A community-first social platform for **creators** — art, handmade, photography, music.
> Not a marketplace, not an ad engine. A place where people who *actually build things* find each other.

---

## The one-paragraph idea

Instagram/TikTok energy, but built for makers instead of sellers. Every user has a
**profile they construct themselves** (bold, fully adjustable — no boring default grid) and a
**main feed** of work from the people and groups they follow. Creators form **groups** by inviting
each other; a group has its own feed, and any post tagged into a group appears in the main feed with
an *"also in [group]"* marker that opens the group. Photographers get true high-resolution handling.
Musicians and artists list **upcoming events** (dates + ticket links) on their profile. People talk
**privately** through a personalized chat. The platform is funded by **donations**, never by
pay-to-be-seen mechanics.

---

## Guiding principles (apply to every phase)

1. **No pay-to-be-seen.** Ranking is chronological and creator/follow-driven. There is no paid boosting, no ads, no "seller" surface anywhere. This is the whole point.
2. **Donation-funded.** The only money flow into the platform is voluntary donations. This is a place of living, not a store.
3. **The user builds their own space.** Profiles and post layouts are highly customizable. Ship real personalization, not one theme toggle.
4. **Respect the work.** Photographers keep full-resolution originals; display versions are optimized separately. Never silently degrade someone's art.
5. **Aesthetic: Bauhaus / Gropius.** Modular glass-grid "windowed" layout. Geometric, functional, asymmetric-but-balanced. Primary accents (red / blue / yellow) on black & white, generous negative space, clean geometric sans-serif. Cards read as *windows* in a facade. Nothing decorative-for-decoration's-sake.
6. **Two core tabs + one group tab.** Feed, Profile, and Groups feed.

---

## Recommended stack

Chosen for speed of building, real-time features, strong media handling, and low operational burden for a small team. Confirm current versions when you scaffold.

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js (App Router) + React + TypeScript** | Best-in-class React framework; SSR/ISR for fast public profiles/feeds. |
| Styling / design system | **Tailwind CSS** + a small custom token layer | Fast to build the strict Bauhaus grid + primary-color system. |
| Layout customization | **CSS Grid + a drag-resize engine** (e.g. `react-grid-layout` or `dnd-kit`) | Powers the user-adjustable "windowed" profile and post layouts. |
| Motion | **Framer Motion** | Windowed panel transitions, feed interactions. |
| Backend + DB + Auth + Realtime | **Supabase** (Postgres, Auth, Realtime, Row-Level Security) | One platform for auth, data, live feeds, and chat sockets; RLS enforces group/DM privacy. |
| Object storage | **Supabase Storage or Cloudflare R2** | Stores full-res originals + generated display sizes. |
| Image pipeline / CDN | **Cloudflare Images / imgix**-style on-the-fly transforms | Serve optimized sizes without touching originals. |
| Payments (donations) | **Stripe** | Mature, supports one-off + recurring donations. |
| Hosting | **Vercel** (frontend) + **Supabase Cloud** (backend) | Minimal ops. |
| Email / notifications | **Resend** (or similar) | Invites, event reminders, donation receipts + appeals. |

> If you later want to fully self-host to stay independent, the equivalent is: Postgres + a NestJS/Fastify API + a websocket layer + S3-compatible storage. Supabase gets you to a launch far faster.

---

## Phase map

| Phase | Delivers | Releasable slice |
|---|---|---|
| 0 | Foundation + Bauhaus design system + auth shell | Log in, see the themed empty app |
| 1 | Profiles ("the user you open") | Create/edit/view a personalized profile |
| 2 | Posts + main feed | Post work, scroll a real feed |
| 3 | High-res media + bold post-layout personalization | Upload full-res, customize how posts display |
| 4 | Groups + group feeds | Create/join/follow groups, cross-post with "also in" marker |
| 5 | Private chat | DM another creator in real time |
| 6 | Events on profiles | Musicians/artists list dated events + ticket links |
| 7 | Donations | Anyone can donate to sustain the platform |
| 8 | Job posts on profiles | Creators advertise & discover creative jobs |
| 9 | Deep personalization, polish, launch prep | Public-ready release |

---

# Phase prompts

Each block below is a standalone prompt. Hand it to your builder/agent as-is.

---

## Phase 0 — Foundation & Bauhaus design system

**Goal:** Stand up the project skeleton, the design system, and a working auth shell. Everything after this plugs into the grid and tokens defined here.

**Build:**
- Scaffold Next.js (App Router) + TypeScript + Tailwind. Set up Supabase (project, client, env).
- Implement auth (email + at least one OAuth). Signed-in users land on an empty themed shell with the three-tab nav: **Feed / Groups / Profile**.
- Define the **Bauhaus design system** as reusable tokens + components:
  - Color: black, white, and primary red/blue/yellow accents only.
  - Typography: geometric sans-serif; strict type scale.
  - A modular **grid** and a `<Window>` card primitive (the recurring "windowed" unit) with clean geometric borders.
  - Motion presets for panels opening/closing like windows.
- Set up the database migration workflow and a seed script.

**Definition of done:** A user can sign up, log in, and navigate three empty tabs rendered in the Bauhaus system. Design tokens and the `<Window>` primitive are documented and reused everywhere afterward.

**Out of scope:** Any real content, posts, or groups.

---

## Phase 1 — Profiles (the space the user builds)

**Goal:** Every user has a profile they construct themselves — bold and adjustable, not a fixed template.

**Build:**
- Profile data model: display name, handle, avatar, bio, links, and a **layout config** (JSON describing arranged "window" blocks).
- Profile **editor**: drag/resize/reorder window blocks on a grid (bio block, gallery block, links block, and placeholders for later event/post blocks). Save layout per user.
- Public profile **view** rendering that layout, server-rendered for speed and shareability.
- Basic follow/unfollow between users (data + button; feed consumption comes in Phase 2).

**Definition of done:** A user can open the editor, arrange their profile windows, save, and share a public URL that renders their custom layout. Another user can follow them.

**Out of scope:** Posts content pipeline (stubbed gallery is fine), events, chat.

---

## Phase 2 — Posts & the main Feed

**Goal:** Creators publish work; followers see a real, chronological feed.

**Build:**
- Post model: media (image first), caption, author, timestamp, tags/category (art, handmade, photography, music).
- Create-post flow with image upload (basic optimized display size for now — full-res pipeline is Phase 3).
- **Main feed**: chronological, from people the user follows, rendered as windows. **No ranking-for-pay, no ads.**
- Post detail view. Wire the profile gallery block (Phase 1) to real posts.

**Definition of done:** A user posts an image with a caption and category; their followers see it in a chronological windowed feed; anyone can open the post detail.

**Out of scope:** Groups, high-res originals, video (note video as a later extension).

---

## Phase 3 — High-resolution media & bold post-layout personalization

**Goal:** Respect photographers' resolution, and let users control how their posts *display* — no boring uniform grid.

**Build:**
- Media pipeline: store the **full-resolution original** untouched; generate multiple optimized display sizes via the image CDN; serve responsive sizes; offer a "view full resolution" path.
- Per-user and/or per-post **display personalization**: aspect ratios, window sizes, spacing, arrangement of their own feed/gallery — bold options, not one toggle. Layout stored in config like the profile.
- Performance pass so large images stay fast (lazy loading, blur-up placeholders).

**Definition of done:** A photographer uploads a high-res file, viewers see a fast optimized version and can access full resolution; a creator can meaningfully restyle how their work is laid out.

**Out of scope:** Groups, chat, events.

---

## Phase 4 — Groups & group feeds

**Goal:** People form groups by inviting each other; groups have their own feeds and connect back to the main feed.

**Build:**
- Group model: name, description (windowed group page), members, and privacy of feed.
- **Invite** flow (member invites another to join).
- Two relationships to a group: **member** (can tag their posts into the group) vs **follower** (sees group content, can't tag). Add a **request-to-join** flow.
- Post → group **tagging**: a member can attach a post to one or more of their groups.
- **Group feed** tab: posts tagged into that group.
- Cross-linking: in the main feed, a post that's also in a group shows an **"also in [group]"** marker; tapping it opens that group's feed.

**Definition of done:** A user creates a group, invites someone, that person joins and tags a post into it; the post appears both in the main feed (with the "also in" marker) and in the group feed; a non-member can follow the group to see its content and can request to join.

**Out of scope:** Chat, events, donations.

---

## Phase 5 — Private chat

**Goal:** Creators connect privately through a personalized, real-time chat.

**Build:**
- 1:1 direct messages using Supabase Realtime; RLS so only participants can read a thread.
- Chat UI in the windowed aesthetic: conversation list + thread, typing/read indicators, image sharing.
- Personalization touches (per-thread accent, layout options) consistent with the platform's customization ethos.
- Entry points: message button on profiles and posts.

**Definition of done:** Two users exchange messages in real time, share an image, and see delivery/read state; only the two participants can access the thread.

**Out of scope:** Group chat (note as a later extension), voice/video.

---

## Phase 6 — Events on profiles

**Goal:** Musicians and performing artists tell people about upcoming events with dates and ticket links.

**Build:**
- Event model on a profile: title, date/time, location (physical or online), description, **ticket/buy link**.
- An **events "window" block** for the profile editor (Phase 1) showing upcoming events sorted by date, past events collapsed.
- Public rendering with a clear call-to-action linking out to buy tickets.
- Optional: opt-in reminder to followers before an event.

**Definition of done:** A musician adds a dated event with a ticket link; it shows on their profile in date order; a visitor taps through to the ticket link.

**Out of scope:** Ticketing/payment inside the platform (link out only), donations.

---

## Phase 7 — Donations

**Goal:** Let the community fund the platform voluntarily — the only money flow in.

**Build:**
- Stripe integration for **one-off and recurring** donations to the platform.
- A clear, honest donation surface explaining what it funds. Keep it non-intrusive — no nag walls, consistent with the no-pressure ethos.
- Donation receipts by email; a simple ledger/admin view of incoming support.
- **Admin donation alerts (triggerable on demand):** an admin-only page where the admin can fire a donation appeal *when needed* — e.g. when running costs are due. Each appeal can:
  - be sent as an in-app banner/notification and/or email;
  - target everyone or a segment (active users, past donors, etc.);
  - carry a custom message and a fundraising goal/progress bar;
  - be scheduled or sent immediately, and switched off again once the need passes.
  - The admin sees basic results per appeal (reach, donations raised). Appeals are deliberately manual so the platform never feels like it's constantly begging.
- (Decide separately whether creator-to-creator tipping is in scope — recommend deferring to keep launch clean and avoid "seller" dynamics.)

**Definition of done:** A supporter makes a one-off or recurring donation via Stripe and receives a receipt; the platform records it. An admin can trigger a donation appeal on demand, target it, watch it raise funds, and turn it off.

**Out of scope:** Any sales, marketplace, or platform fee — this is a donation-only platform by design.

---

## Phase 8 — Job posts on profiles

**Goal:** Help artists find work. A profile can advertise creative jobs/gigs, and people can discover them — many makers struggle to find paid opportunities, so make this a first-class surface.

**Build:**
- Job-post model on a profile: title, discipline/category, description, location (remote/on-site), compensation (range or "negotiable"), and how to apply (in-platform message via the Phase 5 chat, and/or an external link).
- A **jobs "window" block** for the profile editor (Phase 1): lists that user's open postings; closed/filled ones collapse.
- A lightweight **jobs discovery view**: browse/filter open job posts across the platform by discipline, location, and remote/on-site. Chronological — no paid promotion (principle #1).
- Apply flow: opens a chat thread with the poster (or follows the external link).
- Poster controls: mark a post open/filled/closed.

**Definition of done:** A creator publishes a job post that shows on their profile and in the discovery view; another user filters to it and applies by starting a chat (or via the external link); the poster can mark it filled.

**Out of scope:** Payments for jobs, contracts/escrow, applicant tracking beyond simple status.

---

## Phase 9 — Deep personalization, polish & launch prep

**Goal:** Make it feel finished, fast, safe, and ready to open.

**Build:**
- Extend personalization depth across profile, feed, and chat based on what surfaced in earlier phases.
- Accessibility pass (contrast within the primary-color system, keyboard nav, alt text on media).
- Performance & cost pass (image delivery, feed query performance, caching).
- Trust & safety basics: reporting, blocking, content moderation workflow, rate limits.
- Onboarding for new creators; empty-state guidance in the Bauhaus style.
- Launch checklist: legal (ToS/privacy), backups, monitoring/analytics (privacy-respecting, non-ad), and a soft-launch plan.

**Definition of done:** The platform is stable, accessible, moderated at a basic level, and ready for a public soft launch.

---

## Notes & open decisions to settle before Phase 0

- **Video:** Phase 2–3 assume image-first. TikTok-style video is a meaningful add — decide if it's launch-critical or a fast-follow (it raises storage/CDN cost and moderation complexity notably).
- **Group chat:** deferred; slot after Phase 5 if wanted.
- **Creator tipping:** deferred by default to protect the donation-only, non-seller ethos.
- **Donation appeals:** kept deliberately manual (admin-triggered) so the platform never feels like it's constantly asking. Tune frequency by instinct, not by default nagging.
- **Moderation scale:** basic in Phase 9; a growing community will need more.
- **Name & branding:** "Atelier" is a placeholder.
