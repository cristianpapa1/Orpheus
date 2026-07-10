import type { PublicProfile } from "./types";
import { DEFAULT_LAYOUT } from "./layout";

/**
 * Demo profiles served in preview mode (no Supabase configured) so the whole
 * Phase 1 surface — public view, editor, follow button states — is explorable
 * before any credentials exist. Mirrors supabase/seed.sql.
 */
export const DEMO_PROFILES: Record<string, PublicProfile> = {
  ines: {
    id: "00000000-0000-4000-a000-000000000001",
    handle: "ines",
    display_name: "Inês Almeida",
    bio: "Analogue photographer. Lisbon. Silver halides over sensors — full-resolution scans of every frame.",
    avatar_url: null,
    links: [
      { label: "Portfolio", url: "https://example.com/ines" },
      { label: "Darkroom notes", url: "https://example.com/ines/notes" },
    ],
    accent: "blue",
    school: "de-stijl",
    layout: {
      version: 1,
      blocks: [
        { id: "bio", type: "bio", x: 0, y: 0, w: 5, h: 4 },
        { id: "gallery", type: "gallery", x: 5, y: 0, w: 7, h: 6 },
        { id: "links", type: "links", x: 0, y: 4, w: 5, h: 2 },
        { id: "events", type: "events", x: 0, y: 6, w: 12, h: 2 },
        { id: "jobs", type: "jobs", x: 0, y: 8, w: 12, h: 3 },
      ],
    },
    follower_count: 128,
  },
  theo: {
    id: "00000000-0000-4000-a000-000000000002",
    handle: "theo",
    display_name: "Theo Brandt",
    bio: "Ceramics & woodwork. Berlin. Everything hand-thrown, everything signed.",
    avatar_url: null,
    links: [{ label: "Studio", url: "https://example.com/theo" }],
    accent: "yellow",
    school: "swiss",
    layout: DEFAULT_LAYOUT,
    follower_count: 42,
  },
};

/** The signed-out preview user's own editable profile. */
export const DEMO_SELF: PublicProfile = {
  id: "demo-you",
  handle: "you",
  display_name: "Your Name",
  bio: "This is preview mode — your edits save to this browser only until Supabase is connected.",
  avatar_url: null,
  links: [{ label: "Your site", url: "https://example.com" }],
  accent: "red",
  school: "bauhaus",
  layout: DEFAULT_LAYOUT,
  follower_count: 0,
};
