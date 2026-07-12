# Phase 10 — Local-First (instant UI, offline)

> [!IMPORTANT]
> **TO BE REVIEWED BY CLAUDE**
> 
> **Proposed Improvements:**
> - **Schema Migrations:** Add error boundary strategies for RxDB schema mismatches across app updates.
> - **Storage Management:** Define limits for local storage size and eviction policies (e.g., keeping only recent chat messages).
> - **Network Resilience:** Clarify background sync behaviors and exponential backoff retry strategies when connectivity is intermittent.

Source: `prompts/phase-next-localfirst-genui.md` §1 + ProjectArchitecture "Local-First (PowerSync / RxDB)".

## The honest tension (read first)
The prompt says "refactor the data fetching layer so components subscribe to local
SQLite instead of Supabase." Atelier is a **Next.js App Router server-component** app:
most reads already happen on the server under RLS and stream as HTML — there is no
spinner to kill on those. A full local-first rewrite would move that logic to the
**client**, giving up server-side RLS enforcement on reads and duplicating every query.
That is weeks of work and a genuine architecture reversal, not a drop-in.

**Recommendation: do NOT retrofit the whole app.** Apply local-first *surgically* to the
two surfaces where instant + offline actually pays off and which are already client-side:
1. **Chat** — message send/read (append-only → conflict-free).
2. **Profile editor** — already localStorage-in-preview; upgrade to a real synced store.
The chronological feed / market / discovery stay server-rendered (SEO + RLS + no spinner
benefit).

## Engine decision (needs your pick)
| Option | Cost | Fit | Verdict |
|---|---|---|---|
| **RxDB + Supabase replication** | OSS, free | DIY replication, RxDB Dexie/SQLite adapter, works in RN too | **Recommended v1** — no vendor, one lib, native+web |
| **PowerSync** | Paid cloud (or heavy self-host Docker) + Postgres publication + sync rules | Managed, robust CRDT-ish sync | Only if you want managed sync and accept the bill |

## Plan (RxDB path)
1. `packages/core/src/sync/schema.ts` — RxDB collection schemas for `messages`, `profile_draft` (pure, shared web+native).
2. Web + mobile: RxDB database (Dexie adapter web, SQLite adapter native) initialized once.
3. Replication: RxDB Supabase replication plugin, pull+push against `chat_messages` / `profiles`, filtered by the signed-in user; JWT from the existing Supabase session.
4. Conflict resolution: **chat = append-only** (no conflict). **profile draft = last-write-wins on `updated_at`** (already the server rule).
5. Components subscribe to RxDB queries (instant) with an offline banner when the replication stream is down.

## ISCs (draft)
- Chat renders from the local store in <16ms with no network (airplane-mode test).
- A message sent offline appears immediately and syncs on reconnect (verified 2-device).
- Profile-editor edits persist offline and reconcile last-write-wins.
- Feed/market/discovery remain server-rendered (no regression).
- Anti: no read path drops RLS — replication is per-user-JWT filtered, never service role on the client.

## Go-signal needed
Pick **RxDB (recommended)** or **PowerSync (managed, paid)**, and confirm scope =
chat + profile editor only (not a full-app rewrite).
