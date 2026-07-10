# Phase Prompt: Next-Gen Premium Interactions

## Objective
Elevate Orpheus beyond a standard Next.js CRUD app into a highly dynamic, zero-latency experience with generative AI interfaces.

## 1. Local-First Architecture (PowerSync / RxDB)
**Goal**: Eliminate loading spinners entirely and provide a fully functional offline mode.
**Implementation Steps**:
1. Set up PowerSync to connect with the cloud Supabase PostgreSQL instance.
2. In the Next.js client, initialize a local SQLite database running via WASM.
3. Refactor the data fetching layer: components should subscribe to local SQLite queries (which return instantly) instead of fetching directly from Supabase REST/GraphQL APIs.
4. Ensure background synchronization correctly handles conflict resolution (e.g., CRDTs or timestamp-based last-write-wins) when the user comes back online.

## 2. Generative UI (Vercel AI SDK)
**Goal**: Allow users to generate and manipulate Framer Motion / Tailwind components purely through natural language prompts.
**Implementation Steps**:
1. Integrate the Vercel AI SDK alongside an LLM (Mistral or Claude) into the Next.js App Router API.
2. Define a library of base React UI components (cards, lists, hero sections) enriched with Framer Motion variants.
3. Use the AI SDK's `streamUI` capability to map LLM tool-calls directly to these React components.
4. Build a chat interface where the user types "Show me a dark-mode pricing table with bouncy hover effects," and the server streams back the fully interactive React component directly into the DOM.
