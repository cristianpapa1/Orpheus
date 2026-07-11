# Phase 11 — Generative UI ("Atelier Studio")

Source: `prompts/phase-next-localfirst-genui.md` §2 + ProjectArchitecture "Generative UI (Vercel AI SDK)", "Mistral.ai", "e2b.dev", "Mobbin".

## Shape
A `/studio` surface where a creator types natural language and the server **streams back
real, interactive Framer-Motion + Tailwind components** — not text. Used to help creators
build/preview blocks for their windowed profile and (later) storefront.

## The safety line (non-negotiable)
Do **not** stream arbitrary LLM-authored React into the DOM. Two tiers:
1. **Whitelisted registry (default, safe):** LLM tool-calls pick from a fixed library of
   Bauhaus/school-aware components (Card, Gallery, Hero, PricingTable, Quote, Stat…) and
   supply **validated props** (zod-checked). `streamUI` maps tool-calls → those components.
   No code execution. This covers 95% of "show me a dark pricing table with bouncy hover."
2. **Sandboxed code-gen (opt-in, later):** for true custom blocks, run LLM-authored code in
   **e2b.dev** (cloud sandbox), render the built artifact in an iframe. Never eval in-page.

## Stack
- **Vercel AI SDK** (`ai`, `@ai-sdk/react`) — `streamUI` in an App Router route handler.
- **Provider:** Mistral (`@ai-sdk/mistral`, needs `MISTRAL_API_KEY`) **or** reuse Claude
  (`@ai-sdk/anthropic`; catchyawn already has `ANTHROPIC_API_KEY` — reuse only with your OK,
  it's that project's quota). Graceful-degrade: no key → `/studio` shows the static
  component gallery + disabled prompt (same preview-mode pattern as the rest of the app).
- **Registry lives in `packages/core/src/studio/registry.ts`** (pure descriptors: name, zod
  prop schema, school-awareness) so web + native share it; the React implementations live in
  the web app. Unit-test the registry.
- **Mobbin** = design research input for the component library's micro-interactions (not code).

## Plan
1. `packages/core` studio registry (pure, tested) — component id + zod props + variants.
2. `atelier/src/components/studio/*` — the actual RN-friendly-where-possible components with Framer Motion variants.
3. `atelier/src/app/(shell)/studio/page.tsx` — chat UI (AI SDK `useChat`/`useUIStream`).
4. `atelier/src/app/api/studio/route.ts` — `streamUI` with the whitelisted tools; env-gated provider.
5. Persist generated block config to the profile layout (ties back to the windowed editor).

## ISCs (draft)
- `/studio` 200; no key → static gallery + disabled prompt notice (no crash).
- With a key: "dark pricing table, bouncy hover" streams a real interactive component.
- Anti: no `eval`/`dangerouslySetInnerHTML` of model output; props are zod-validated.
- Registry is pure (zero react/next imports) and unit-tested, per M0 rules.

## Go-signal needed
Provider choice: **Mistral (new key)** or **reuse catchyawn's Anthropic key**. Then executable.
