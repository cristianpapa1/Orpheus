# Phase 12 — Market (personalized stores; books-first; Firecrawl import)

> [!IMPORTANT]
> **TO BE REVIEWED BY CLAUDE**
> 
> **Proposed Improvements:**
> - **Stripe Onboarding Details:** Clarify the specific Stripe Connect flow (e.g., embedded components vs. hosted onboarding) and how to handle incomplete onboardings.
> - **Webhook Idempotency:** Specify idempotency and failure recovery mechanisms for Stripe order webhooks to prevent duplicate orders or missed fulfilments.
> - **Data Privacy (GDPR):** Address privacy implications and data retention policies when scraping, structuring, and storing external shop data via Firecrawl.

The "carefully plan" one. Source: Cristian's directive + ProjectArchitecture
"Firecrawl", "Mobbin", "Hyper.is", "Mistral", "Stripe".

## ⚠️ Founding-principle conflict — resolve BEFORE building
Atelier currently *states, in product copy and the ISA*: **"No ads, no pay-to-be-seen,
no marketplace, no sellers."** (donate page, /welcome, /terms, /privacy, ISA Principles +
Out of Scope + anti-criteria ISC-40.) A Market tab contradicts the literal words.

**Proposed reconciliation (needs your approval):** distinguish two different things the
current copy conflates —
- **"Pay to be *seen*"** (banned, forever): buying reach, ranking, promoted placement, ads.
- **"Sell what you *make*"** (the point of Phase 12): a creator selling their *own* work —
  books above all. Opt-in per creator. This is *for* artists, not against them.

Invariants that MUST survive so the ethos holds:
1. **No paid placement.** Market discovery stays chronological / follow-driven. Nobody can
   buy a higher slot. (Keeps ISC-40's spirit; reword the literal "no marketplace" lines.)
2. **The artist owns the sale.** Money goes to the creator (Stripe **Connect**); the platform
   takes **0% or a transparent flat fee that buys nothing but upkeep** — never visibility.
3. **Personalized, not a mall.** A store is an extension of the creator's *space*: it
   inherits their `school`, their patterns, their windowed facade. Not a generic grid.
4. Selling is **opt-in**; non-sellers never see seller UI (mirrors member-vs-follower).

Deliverable of this decision: reword Principles/Out-of-Scope/donate/terms to draw the
"seen vs make" line, and add anti-criteria: `Anti: no product can be boosted for payment`.

## Data model (proposed)
- `stores` — one per creator, opt-in. `owner_id`, `slug`, `name`, `about`, `payout` (stripe
  connect acct id | null), `fulfilment` ('stripe' | 'external'), `is_open`, inherits profile.school.
- `products` — books first-class. `store_id`, `kind` ('book'|'print'|'zine'|'other'),
  `title`, `author`, `isbn`, `format` ('paperback'|'hardcover'|'ebook'|'audio'),
  `description`, `price_cents`, `currency`, `image_path`, `inventory` (int | null=preorder),
  `external_url` (seller's own buy page | null), `status` ('draft'|'live'|'sold_out'|'archived'),
  `source` ('manual'|'import'), created_at.
- `product_imports` — the Firecrawl staging table (below).
- `orders` — only when fulfilment='stripe': Stripe Checkout/Connect session, buyer, product,
  amount, status; webhook-written (same forge-proof pattern as donations — no client insert).
- RLS: products public-read; store-owner writes; orders readable by buyer + store owner.

## Firecrawl import (the integration bridge — key ask)
A seller who owns their own shop shouldn't re-type their catalogue.
Flow: **seller pastes their shop URL → Firecrawl scrapes → Mistral structures →
seller reviews staging → approves → products created.**
1. `firecrawl` scrape/crawl the seller's URL(s) → clean markdown/HTML per product page.
2. **Mistral** (structured output) maps each page → `{title, author, isbn, price, format,
   image, description}`; low-confidence rows flagged.
3. Rows land in `product_imports` (status 'pending'), shown in a review table (`/store/import`).
4. Seller edits/approves → rows promoted to `products` (source='import').
5. Optional **re-sync cron** (Firecrawl) keeps price/stock fresh; diffs surface for approval.
6. Fulfilment choice per product: **external_url** (link-out to their own store, zero platform
   involvement — mirrors events/jobs ethos) **or** Stripe Connect checkout hosted here.

## Surfaces
- `/market` tab — chronological, follow-first, filter by kind (books default). No ranking.
  Each product → creator profile. School-themed cards (Mobbin-researched micro-interactions).
- `/store` (owner) — become-a-store toggle, product CRUD, `/store/import` (Firecrawl), orders.
- Product detail `/m/[id]` — windowed, school-skinned, buy (external or Stripe), "by @creator".
- "Hyper.is" reference = aesthetic study only (make a mundane thing beautiful).

## Payments decision (needs your pick)
Stripe **Connect** (Standard or Express) so payouts go to the artist. Platform fee: **0%**
(pure donation-funded) vs a small transparent flat fee. Recommend 0% at launch — it's the
strongest possible expression of the ethos and a real differentiator.

## Phasing
12a data model + become-a-store + manual product CRUD + `/market` discovery (no payments →
link-out only, like jobs). 12b Stripe Connect checkout + orders + webhook. 12c Firecrawl
import + Mistral structuring + review. 12d re-sync cron.

## Go-signals needed
1. Approve the **"sell what you make" ≠ "pay to be seen"** reconciliation + copy reword.
2. Firecrawl key + Mistral key (Mistral shared with Phase 11).
3. Platform fee: **0%** (recommended) or flat fee.
4. Fulfilment default: link-out first (12a), Stripe Connect second (12b) — confirm order.
