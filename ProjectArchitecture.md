# Orpheus - Project Architecture

## Stack Definition

Orpheus is a workspace utilizing **Bun** for package management, structured around a primary application (`atelier`).

- **Framework**: Next.js (React).
- **Backend/Database**: Supabase (Cloud PostgreSQL).
- **Authentication**: Supabase Auth (SSR configured).
- **Payments**: Stripe.
- **Styling**: Tailwind CSS v4, Framer Motion.

## Architecture & Decisions

### 1. Backend-as-a-Service (BaaS) via Supabase
**Reason**: Offloads the complexity of managing servers, databases, and authentication. Supabase provides a fully managed PostgreSQL database, instant REST/GraphQL APIs, and robust authentication.
**Implications**: There is no local `docker-compose` or local data folder managing the database. The app connects directly to a cloud-hosted Supabase instance (as defined in `.env.local`). This allows for incredibly rapid prototyping and eliminates dev-ops overhead for small teams.
**Alternatives**: 
- Firebase (NoSQL, vendor lock-in).
- Custom Node.js/Express backend (requires significantly more boilerplate, database management, and custom auth implementation).

### 2. Next.js App Router
**Reason**: Industry standard for React applications requiring SEO, Server-Side Rendering (SSR), and seamless API routes.
**Implications**: Tight integration with `@supabase/ssr` allows authentication state to be securely managed via cookies on the server before the page even renders, preventing UI flickering on secure routes.
**Alternatives**: Vite + React SPA (worse SEO, harder secure route protection), Remix.

### 3. Bun Workspaces
**Reason**: Used for managing dependencies (`@atelier/core` and the main app). 
**Implications**: Bun acts as an incredibly fast drop-in replacement for npm, speeding up CI and local `bun install` times.
**Alternatives**: npm, yarn, pnpm.

### 4. Stripe Integration
**Reason**: Handles donations and complex payment flows securely.
**Implications**: Relies on Webhooks hitting the Next.js API routes (`/api/stripe/webhook`) to securely update the Supabase database using a `SERVICE_ROLE_KEY` (bypassing Row Level Security to record payments).
**Alternatives**: PayPal, LemonSqueezy.

### 5. Framer Motion & Tailwind v4
**Reason**: Tailwind v4 provides a zero-config, highly performant utility-first styling engine, while Framer Motion handles complex, physics-based UI animations.
**Implications**: Ensures the UI feels premium and dynamic, which is critical for modern web applications.

## Study and Ideas of Use

### e2b.dev (Cloud AI Sandboxing)
- **Idea**: If Orpheus expands to allow users to generate code, themes, or custom functional blocks within the app, e2b.dev can securely sandbox and execute these user-generated scripts in the cloud before rendering the output on the Next.js frontend.

### Firecrawl (LLM Web Scraping)
- **Idea**: To keep the Orpheus platform populated with fresh content, Firecrawl could be set up as a cron job to scrape inspiration, articles, or resources from the web, cleanly formatting them into markdown and injecting them directly into the Supabase database.

### Hyper.is (Web-based Terminal)
- **Idea**: As a project focusing on a premium developer or creator experience, Hyper.is serves as a fantastic case study in how to make a typically boring tool (a terminal) look stunning using CSS, web technologies, and plugins. This philosophy aligns perfectly with Orpheus's aesthetic goals.

### Mistral.ai (High-Performance Open LLMs)
- **Idea**: Integrate Mistral (perhaps via their API) to power features like "smart categorization," content summarization, or a generative UI within Orpheus. Mistral's 'Le Chat' or API provides a highly capable, cost-effective alternative to OpenAI.

### Mobbin.com (UI/UX Pattern Library)
- **Idea**: **Critical for Orpheus**. Since Orpheus mandates a "premium and dynamic UI" utilizing Tailwind v4 and Framer Motion, Mobbin will be the primary research tool. By studying the micro-interactions, layouts, and typography of top iOS and Web apps on Mobbin, the team can translate those designs into Framer Motion animations.
