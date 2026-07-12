# Phase 14 — Social signals, and a product-ideas backlog

> Started 2026-07-11. Part of this phase ships now (favorites, double-tap, share
> to mutuals, /saved); the rest is a ranked backlog of improvements + product
> ideas to pull from next.

## Shipped in 14.0 (this session)
- **Favorite (save) a post** — heart + live count on feed / group / post pages.
- **Double-tap to favorite** — on the post page (and any place the media is wrapped),
  a double-tap hearts it with a burst animation.
- **Share to a mutual follow** — a Share button lists people you both follow and sends
  the post as a chat message with its link.
- **/saved** — browse everything you've favorited, newest first.
- Requires migration `0016_post_favorites.sql`. Reads are defensive (feature stays dark
  until the table exists), so deploy never precedes migration unsafely.

## Near-term extensions of 14.0 (small, high-value)
1. **Save vs. favorite split** — today "favorite" doubles as save. Consider a separate,
   private **bookmark** (no public count) plus a public **like**. Low effort: a `kind`
   column on `post_favorites` or a second table.
2. **Collections** — named, ordered sets of saved posts ("reading list", "for the studio").
   A `collections` + `collection_items` pair; /saved becomes tabbed.
3. **Favorite / save groups & institutions** — you can follow groups; add a lightweight
   "save" (bookmark) for groups and a **follow** for institution profiles so their work
   reaches your feed. Browse them under /saved or a "Following" tab.
4. **Notifications** — someone favorited/shared/mentioned your work, requested/approved a
   claim, invited you to a group. A `notifications` table + a nav bell + a /notifications
   page. This is the single biggest engagement multiplier and unlocks email digests (Resend
   is wired). **Recommended next.**
5. **Share targets beyond DMs** — share into a group you're a member of; copy public link.

## Product ideas (ranked rough — pull from the top)
### Engagement & conversation
- **Comments / threaded replies on posts** (with the same AI moderation + report path).
- **Reactions** beyond the heart (a small, curated set — no vanity metrics arms race).
- **Activity feed** ("recent from institutions you follow", "your circle favorited…").

### Discovery
- **Search** — posts, people, institutions, groups (Postgres FTS or a search service).
- **Hashtags / topic tags** on posts, browsable; complements the category/subcategory taxonomy.
- **Institution digests** — weekly email of new work from the museums/journals/podcasts you follow.
- **Editor's picks / curated rows** — human-curated, never algorithmic ranking (stay true to the "no algorithm" principle).

### For institutions & pros (build on the claim system)
- **Verified badge** once a claim is approved (distinguish claimed from community profiles).
- **Institution analytics** — reach, follows, saves on their posts (private dashboard).
- **Open calls / opportunities board** — extends jobs; museums post residencies, journals post submissions.
- **Newsletters** — journals (New Yorker-style) and podcasts publish issues/episodes to subscribers.
- **Podcast/audio-first player** — episode list, resume playback, playlists.

### Craft & media
- **Multi-image posts / galleries per post** (carousel), and richer text formatting for poems (stanza spacing, drop caps).
- **Playlists / reading lists** as first-class shareable objects.
- **Offline / local-first** for chat + profile editor (see phase-10).

### Trust & safety (harden what exists)
- **Soft-delete + audit trail** for takedowns (reversible; currently hard-delete). One migration.
- **Extend AI moderation** to profile bio/name/contact, group descriptions, chat (currently posts only).
- **Appeals for takedowns** (mirror the donation-appeals pattern).
- **Rate-limit + abuse dashboards** for admins.

### Platform
- **Mobile push notifications** (Expo app exists) tied to the notifications table.
- **i18n** — there's already Portuguese user content; formalize locale support.
- **Import pipelines** — Firecrawl (already used for institutions) to let creators import an existing site/portfolio.

## Go-signals / decisions to make
- Confirm **notifications** as the next build (recommended) — and whether email digests are in scope.
- Decide the **save/like split** (one concept or two).
- Decide takedown model: keep **hard-delete** or move to **soft-delete + audit** (one migration).
- Whether institution profiles get a **followable feed** distinct from personal follows.
