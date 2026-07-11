import type { PublicProfile } from "@atelier/core/profile/types";
import { DEFAULT_LAYOUT } from "@atelier/core/profile/layout";

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
    contacts: [
      { kind: "link", label: "Portfolio", value: "https://example.com/ines" },
      { kind: "email", label: "Commissions", value: "ines@example.com" },
    ],
    accent: "blue",
    school: "de-stijl",
    account_type: "individual",
    institution_kind: null,
    interests: ["cat:photography", "school:de-stijl"],
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
    contacts: [{ kind: "link", label: "Studio", value: "https://example.com/theo" }],
    accent: "yellow",
    school: "swiss",
    account_type: "individual",
    institution_kind: null,
    interests: ["cat:handmade", "cat:music"],
    layout: DEFAULT_LAYOUT,
    follower_count: 42,
  },
  atelier_museum: {
    id: "00000000-0000-4000-a000-000000000009",
    handle: "atelier_museum",
    display_name: "Atelier Museum of Modern Craft",
    bio: "A community-run museum profile — exhibitions, open calls, and a public collection. (Demo institution.)",
    avatar_url: null,
    contacts: [
      { kind: "link", label: "Website", value: "https://example.com/museum" },
      { kind: "address", label: "Visit", value: "1 Bauhaus Str, Berlin" },
    ],
    accent: "red",
    school: "bauhaus",
    account_type: "institution",
    institution_kind: "museum",
    interests: ["cat:visual", "cat:handmade", "school:bauhaus"],
    layout: DEFAULT_LAYOUT,
    follower_count: 512,
  },
};

/** The signed-out preview user's own editable profile. */
export const DEMO_SELF: PublicProfile = {
  id: "demo-you",
  handle: "you",
  display_name: "Your Name",
  bio: "This is preview mode — your edits save to this browser only until Supabase is connected.",
  avatar_url: null,
  contacts: [{ kind: "link", label: "Your site", value: "https://example.com" }],
  accent: "red",
  school: "bauhaus",
  account_type: "individual",
  institution_kind: null,
  interests: [],
  layout: DEFAULT_LAYOUT,
  follower_count: 0,
};
