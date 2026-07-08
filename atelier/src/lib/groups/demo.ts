import type { Group, GroupMember, GroupTag } from "./types";

/**
 * Demo groups for preview mode. One public, one private — so every viewer
 * relation and the private-feed notice are explorable without credentials.
 * The preview viewer ("you") is a MEMBER of Analogue Circle, which makes
 * the composer's group-tagging controls visible in preview.
 */

export const DEMO_GROUPS: Record<string, Group> = {
  "analogue-circle": {
    id: "10000000-0000-4000-a000-000000000001",
    name: "Analogue Circle",
    slug: "analogue-circle",
    description:
      "Film, darkrooms, and slow process. Scans welcome — phone snaps of prints too.",
    is_private: false,
    created_by: "00000000-0000-4000-a000-000000000001",
    member_count: 3,
    follower_count: 23,
  },
  "clay-wood": {
    id: "10000000-0000-4000-a000-000000000002",
    name: "Clay & Wood",
    slug: "clay-wood",
    description:
      "A quiet room for people who fire and carve. Private feed — members share works in progress.",
    is_private: true,
    created_by: "00000000-0000-4000-a000-000000000002",
    member_count: 1,
    follower_count: 7,
  },
};

export const DEMO_GROUP_MEMBERS: Record<string, GroupMember[]> = {
  "analogue-circle": [
    {
      profile_id: "00000000-0000-4000-a000-000000000001",
      handle: "ines",
      display_name: "Inês Almeida",
      role: "owner",
    },
    {
      profile_id: "00000000-0000-4000-a000-000000000002",
      handle: "theo",
      display_name: "Theo Brandt",
      role: "member",
    },
    {
      profile_id: "demo-you",
      handle: "you",
      display_name: "Your Name",
      role: "member",
    },
  ],
  "clay-wood": [
    {
      profile_id: "00000000-0000-4000-a000-000000000002",
      handle: "theo",
      display_name: "Theo Brandt",
      role: "owner",
    },
  ],
};

/** post id → group tags (the "also in" markers). */
export const DEMO_POST_GROUPS: Record<string, GroupTag[]> = {
  "demo-ines-1": [{ slug: "analogue-circle", name: "Analogue Circle" }],
  "demo-ines-2": [{ slug: "analogue-circle", name: "Analogue Circle" }],
  "demo-theo-1": [{ slug: "clay-wood", name: "Clay & Wood" }],
};

/** group slug → post ids in that group's feed (chronology handled by queries). */
export const DEMO_GROUP_POSTS: Record<string, string[]> = {
  "analogue-circle": ["demo-ines-1", "demo-ines-2"],
  "clay-wood": ["demo-theo-1"],
};
