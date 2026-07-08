import type { Post } from "./types";

/**
 * Demo posts served in preview mode (no Supabase). Authors mirror the demo
 * profiles; images are local Bauhaus placeholder SVGs.
 */
export const DEMO_POSTS: Post[] = [
  {
    id: "demo-theo-1",
    author_id: "00000000-0000-4000-a000-000000000002",
    author_handle: "theo",
    author_name: "Theo Brandt",
    caption: "Chawan #41 — iron glaze, wood-fired. Kept the kiln scar.",
    category: "handmade",
    image_url: "/demo/theo-1.svg",
    image_width: 800,
    image_height: 600,
    created_at: "2026-07-07T09:30:00Z",
  },
  {
    id: "demo-ines-1",
    author_id: "00000000-0000-4000-a000-000000000001",
    author_handle: "ines",
    author_name: "Inês Almeida",
    caption: "Fira, morning. Silver gelatin, scanned at full resolution.",
    category: "photography",
    image_url: "/demo/ines-1.svg",
    image_width: 800,
    image_height: 600,
    created_at: "2026-07-06T18:12:00Z",
  },
  {
    id: "demo-ines-2",
    author_id: "00000000-0000-4000-a000-000000000001",
    author_handle: "ines",
    author_name: "Inês Almeida",
    caption: "Contact sheet — Rossio at noon, frames 12 through 24.",
    category: "photography",
    image_url: "/demo/ines-2.svg",
    image_width: 800,
    image_height: 600,
    created_at: "2026-07-03T11:00:00Z",
  },
  {
    id: "demo-theo-2",
    author_id: "00000000-0000-4000-a000-000000000002",
    author_handle: "theo",
    author_name: "Theo Brandt",
    caption: "Oak stool, wedged joints. No screws, no glue.",
    category: "handmade",
    image_url: "/demo/theo-2.svg",
    image_width: 800,
    image_height: 600,
    created_at: "2026-07-01T15:45:00Z",
  },
  {
    id: "demo-ines-3",
    author_id: "00000000-0000-4000-a000-000000000001",
    author_handle: "ines",
    author_name: "Inês Almeida",
    caption: "Studies in red — collage from rejected prints.",
    category: "art",
    image_url: "/demo/ines-3.svg",
    image_width: 800,
    image_height: 600,
    created_at: "2026-06-28T08:20:00Z",
  },
];
