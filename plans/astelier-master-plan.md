# Astelier — the commerce sibling to Atelier (master plan)

> Big plan, decision-ready. Astelier is a **separate platform** where makers
> sell — sharing Atelier's account layer and Bauhaus design, but never turning
> Atelier itself into a marketplace. Supersedes `plans/phase-12-market.md` (that
> proposed an in-app market tab, which reverses Atelier's "no marketplace"
> principle; Astelier resolves the tension by being its own place).
>
> Status: PLAN ONLY — nothing built. Awaiting go-signals (see end).

## 1. Positioning & principles
- **Atelier** stays the social facade: chronological, no ads, no pay-to-be-seen,
  **no marketplace inside it**. Commerce never ranks or pollutes the feed.
- **Astelier** is the commerce layer, a **distinct app + domain**
  (`astelier.aunflaneur.com`), visually identical (same Window chrome, tokens,
  artistic schools). Selling is explicit and opt-in.
- The only bridges back into Atelier are **user-initiated links** (a store link
  on your profile; a "Checkout at Astelier" button on posts you choose) — never
  promoted, never ranked. This keeps Atelier's ISA principle intact.
- Commerce principle (from phase-12): **sell what you MAKE, not pay to be seen.**
  No paid placement, no boosted listings. The maker owns the sale.

## 2. Account & access model (the gate you described)
- **Shared identity**: Astelier uses the **same Supabase auth** and the same
  `profiles` table. Your Atelier account *is* your Astelier account — one sign-in.
- **Access gate**: a signed-in user unlocks Astelier once they **follow ≥ 15
  people** on Atelier (`select count(*) from follows where follower_id = me`).
  Under 15 → a "Follow 15 makers on Atelier to enter Astelier" screen with a
  progress count. (Rationale: you participate in the community before you transact.)
- **Roles** (once gated):
  - **Buyer** — the default; browse and purchase.
  - **Seller + buyer** — opts in by **creating a store**. Being a seller is a
    superset; there's no seller-only.
- No new auth system — everything keys off the existing `profiles` + `follows`.

## 3. Monorepo & code sharing
- New workspace **`astelier/`** (Next.js 16, same stack as `atelier/`).
- Extract shared chrome into **`packages/ui`**: `Window`, `WindowGrid`,
  `globals.css` tokens + the artistic-school scopes, `Nav`/`BottomNav` shells.
  Both apps import it → pixel-identical, one source of truth. (Today these live
  in `atelier/src/components/ui` + `atelier/src/app/globals.css`.)
- **`packages/commerce`** (or fold into `@atelier/core`): pure domain modules —
  money formatting, product/order types, cart math, price validation — with bun
  tests, shared by web + any future mobile.
- Same **Supabase project/DB** (shared auth + cross-references). Commerce tables
  are new (section 5); Astelier reads Atelier's `profiles`/`follows` read-only
  for identity + the gate.
- Same **Stripe** account (donations already wired: `lib/donations/stripe.ts`,
  `api/stripe/webhook`) — reused for Stripe Connect.

## 4. Cross-linking Atelier ↔ Astelier
- **Profile → store**: when a profile has an active store, their **Atelier
  profile page shows a "Shop at Astelier →" link**. Implementation: Astelier
  writes the store; Atelier reads it (a `stores` row keyed by `owner_id`, or a
  denormalized `profiles.store_slug`). Rendered in the profile header /
  Contact window.
- **Post → product/store**: a post gains an optional **`checkout_url`**
  (a store or product URL on Astelier). When set, the post's **Act ▾** menu on
  Atelier shows **"Checkout at Astelier"** that deep-links there. The composer
  gets an optional "Astelier link" field. (Small, contained Atelier change —
  one column + one Act entry + one composer field.)

## 5. Data model (new tables, shared DB — prefix `astelier_`)
- **astelier_stores**: `id, owner_id → profiles(id) unique, name, slug unique,
  description, banner_path, accent, school, is_active, created_at`.
  (One store per profile in v1; multi-store later.)
- **astelier_products**: `id, store_id, title, description, price_cents,
  currency, images jsonb, discipline tags (reuse taxonomy), external_url
  (link-out fulfilment), stock/available, status (draft|live|sold_out),
  created_at`.
- **astelier_orders / astelier_order_items** (Stripe-Connect phase):
  `order(id, buyer_id, store_id, total_cents, currency, status, stripe_pi,
  created_at)`, `item(order_id, product_id, qty, unit_price_cents)`.
- **astelier_connect_accounts**: `store_id, stripe_account_id, charges_enabled`
  (seller Stripe Connect onboarding state).
- **Atelier-side additions**: `posts.checkout_url text null`; store link read
  from `astelier_stores` (or `profiles.store_slug`).
- RLS: stores/products public-read; owner writes their own; orders visible to
  buyer + store owner; Connect rows owner-only.

## 6. Fulfilment — two stages
1. **Link-out first (fast, low-risk)**: a product carries the seller's own shop
   URL (`external_url`); "Buy" opens it. Astelier is a beautiful catalog +
   discovery; the sale happens on the seller's own store. No money touches us →
   no PCI/tax burden yet. Ships value quickly.
2. **Stripe Connect (own the sale)**: sellers onboard via Stripe Connect
   (Express); checkout runs through Astelier; funds go to the seller;
   **recommended platform fee 0%** (community-first). Orders, receipts (Resend),
   refunds/disputes. This is the heavier lift (tax, payouts, disputes).

## 7. Discovery inside Astelier (no ranking, like Atelier)
- Browse stores/products by **discipline** (reuse `DISCIPLINE_OPTIONS`) and by
  **artistic school**; chronological or price sort — never algorithmic reach.
- Global search over stores/products (mirror Atelier's `/search`).
- Personalized storefronts skinned by the seller's chosen school (phase-12 idea).

## 8. Seller onboarding & import
- Create-store flow (name, slug, description, school, banner).
- **Firecrawl + Mistral import** (from phase-12): seller pastes an existing shop
  URL → scrape → structure into a **staging** product list → seller reviews →
  import. So sellers who already have a site don't re-type their catalog.

## 9. Trust, safety, ops
- Reuse Atelier's moderation spine: reports (add commerce subjects), admin
  takedown/soft-delete, AI moderation on product text/images.
- **Quality stamps** could gate advanced seller features later (trusted sellers).
- Refunds/disputes, seller verification (tie to the claim/verified system).
- **Legal/tax/payments are out of my depth** — consumer-sales law, sales tax/VAT,
  marketplace-facilitator rules, and KYC vary by region. Before the Stripe-Connect
  stage, **verify the setup with a qualified legal/tax professional** and your
  payments contact.

## 10. Deploy
- `astelier.aunflaneur.com` via the existing cloudflared tunnel (add ingress),
  new systemd user unit `astelier-web.service` on a new port (e.g. `:3200`).
  Same Supabase + Stripe env. Mirror Atelier's build/restart runbook.

## 11. Phased build plan
- **A · Foundations** — `astelier/` workspace; extract `packages/ui`; shared auth;
  the **15-follow access gate**; Astelier landing + nav; deploy to the subdomain.
- **B · Stores** — create/edit store, public store page; **profile link-back on
  Atelier**.
- **C · Products** — product CRUD, product pages, store catalog, images pipeline
  (reuse Atelier's storage/variants approach).
- **D · Post ↔ product** — `posts.checkout_url` + composer field + Atelier Act
  **"Checkout at Astelier"**.
- **E · Discovery** — browse by discipline/school + search inside Astelier.
- **F · Fulfilment I (link-out)** — external_url buy buttons; catalog-only sales.
- **G · Fulfilment II (Stripe Connect)** — seller onboarding, checkout, orders,
  receipts, refunds. (Gated on the legal/tax review.)
- **H · Import** — Firecrawl+Mistral catalog import.
- **I · Polish** — analytics for sellers, storefront theming, mobile.

Each phase ships behind the same deploy-safe + migration discipline we've used
(defensive reads; apply SQL; verify live).

## 12. Decisions needed (go-signals)
1. **Domain**: `astelier.aunflaneur.com` ok? (assumed).
2. **Fulfilment order**: link-out first, Stripe Connect second? (recommended).
3. **Platform fee**: **0%** recommended — confirm.
4. **Stores per user**: one (v1) vs many — recommend one.
5. **Products reuse the discipline taxonomy?** (recommended yes).
6. **Access gate**: exactly **15 follows**? (as stated) — and follow-count only,
   or also require onboarding complete? (recommend: onboarded + 15 follows).
7. **Multi-currency** now or single currency v1? (recommend single first).
8. **When we reach Fulfilment II**, confirm you'll get a legal/tax review.

## 13. What this changes in Atelier (small, contained)
- `posts.checkout_url` column + composer field + one Act menu entry.
- Profile "Shop at Astelier →" link when a store exists.
- Extract `packages/ui` (refactor; no behavior change).
Everything else is net-new in `astelier/`.
