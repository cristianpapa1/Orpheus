import type { Post } from "./types";

/**
 * Demo posts served in preview mode (no Supabase). Authors mirror the demo
 * profiles; images are local Bauhaus placeholder SVGs. Display configs
 * deliberately vary to show Phase 3 personalization in the preview feed.
 */

// A 4×3 grey blur placeholder, to exercise the blur-up path in preview.
const DEMO_BLUR =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><rect width="4" height="3" fill="#c9c5b8"/></svg>',
  );

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
    original_url: null,
    variants: [{ width: 800, url: "/demo/theo-1.svg" }],
    blur_data: null,
    display: { frame: "plate", span: "wide", aspect: "natural" },
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
    original_url: "/demo/ines-1.svg",
    variants: [
      { width: 480, url: "/demo/ines-1.svg" },
      { width: 800, url: "/demo/ines-1.svg" },
    ],
    blur_data: DEMO_BLUR,
    display: { frame: "full-bleed", span: "standard", aspect: "landscape" },
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
    original_url: null,
    variants: [{ width: 800, url: "/demo/ines-2.svg" }],
    blur_data: null,
    display: { frame: "inset", span: "standard", aspect: "square" },
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
    original_url: null,
    variants: [{ width: 800, url: "/demo/theo-2.svg" }],
    blur_data: null,
    display: { frame: "inset", span: "standard", aspect: "natural" },
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
    original_url: null,
    variants: [{ width: 800, url: "/demo/ines-3.svg" }],
    blur_data: null,
    display: { frame: "full-bleed", span: "full", aspect: "landscape" },
    created_at: "2026-06-28T08:20:00Z",
  },
];
