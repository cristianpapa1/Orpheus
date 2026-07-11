/**
 * Atelier profile layout engine — pure functions, no DOM.
 * A profile layout is a set of window blocks on a 12-column grid.
 * Every mutation returns a new, collision-free, compacted layout,
 * so the editor and the server can share one source of truth.
 */

export const GRID_COLS = 12;

export type ProfileBlockType =
  | "bio"
  | "links"
  | "gallery"
  | "posts"
  | "events"
  | "jobs";

export interface LayoutBlock {
  id: string;
  type: ProfileBlockType;
  x: number; // column, 0-based
  y: number; // row, 0-based
  w: number; // columns spanned
  h: number; // rows spanned
}

export interface ProfileLayout {
  version: 1;
  blocks: LayoutBlock[];
}

export const BLOCK_TYPES: ProfileBlockType[] = [
  "bio",
  "links",
  "gallery",
  "posts",
  "events",
  "jobs",
];

export const BLOCK_LABEL: Record<ProfileBlockType, string> = {
  bio: "Bio",
  links: "Contact",
  gallery: "Gallery",
  posts: "Posts",
  events: "Events",
  jobs: "Jobs",
};

/** Minimum size per block type, in grid units. */
export const MIN_SIZE: Record<ProfileBlockType, { w: number; h: number }> = {
  bio: { w: 3, h: 2 },
  links: { w: 2, h: 2 },
  gallery: { w: 4, h: 2 },
  posts: { w: 4, h: 2 },
  events: { w: 3, h: 2 },
  jobs: { w: 3, h: 2 },
};

/** Default size a block takes when added to the canvas. */
const DEFAULT_SIZE: Record<ProfileBlockType, { w: number; h: number }> = {
  bio: { w: 7, h: 3 },
  links: { w: 5, h: 3 },
  gallery: { w: 12, h: 4 },
  posts: { w: 8, h: 3 },
  events: { w: 4, h: 3 },
  jobs: { w: 8, h: 3 },
};

export const DEFAULT_LAYOUT: ProfileLayout = {
  version: 1,
  blocks: [
    { id: "bio", type: "bio", x: 0, y: 0, w: 7, h: 3 },
    { id: "links", type: "links", x: 7, y: 0, w: 5, h: 3 },
    { id: "gallery", type: "gallery", x: 0, y: 3, w: 12, h: 4 },
  ],
};

const clampInt = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(v)));

/** Clamp a block to legal size and position inside the grid. */
export function clampBlock(block: LayoutBlock): LayoutBlock {
  const min = MIN_SIZE[block.type];
  const w = clampInt(block.w, min.w, GRID_COLS);
  const h = Math.max(min.h, Math.round(block.h));
  const x = clampInt(block.x, 0, GRID_COLS - w);
  const y = Math.max(0, Math.round(block.y));
  return { ...block, x, y, w, h };
}

export function rectsOverlap(a: LayoutBlock, b: LayoutBlock): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

const byPosition = (a: LayoutBlock, b: LayoutBlock) => a.y - b.y || a.x - b.x;

/**
 * Push blocks down until nothing overlaps. The active block (just moved or
 * resized by the user) keeps its position; everything else yields.
 */
export function resolveCollisions(
  blocks: LayoutBlock[],
  activeId?: string,
): LayoutBlock[] {
  const active = blocks.filter((b) => b.id === activeId);
  const rest = blocks.filter((b) => b.id !== activeId).sort(byPosition);
  const placed: LayoutBlock[] = [...active];

  for (const block of rest) {
    const candidate = { ...block };
    while (placed.some((p) => rectsOverlap(p, candidate))) {
      candidate.y += 1;
    }
    placed.push(candidate);
  }

  const order = new Map(blocks.map((b, i) => [b.id, i]));
  return placed.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
}

/** Pull every block as far up as it can go. Idempotent. */
export function compactVertical(blocks: LayoutBlock[]): LayoutBlock[] {
  const placed: LayoutBlock[] = [];
  for (const block of [...blocks].sort(byPosition)) {
    const candidate = { ...block };
    while (candidate.y > 0) {
      const up = { ...candidate, y: candidate.y - 1 };
      if (placed.some((p) => rectsOverlap(p, up))) break;
      candidate.y -= 1;
    }
    placed.push(candidate);
  }
  const order = new Map(blocks.map((b, i) => [b.id, i]));
  return placed.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
}

function normalize(blocks: LayoutBlock[], activeId?: string): LayoutBlock[] {
  return compactVertical(resolveCollisions(blocks, activeId));
}

export function moveBlock(
  layout: ProfileLayout,
  id: string,
  x: number,
  y: number,
): ProfileLayout {
  const blocks = layout.blocks.map((b) =>
    b.id === id ? clampBlock({ ...b, x, y }) : b,
  );
  return { ...layout, blocks: normalize(blocks, id) };
}

export function resizeBlock(
  layout: ProfileLayout,
  id: string,
  w: number,
  h: number,
): ProfileLayout {
  const blocks = layout.blocks.map((b) =>
    b.id === id ? clampBlock({ ...b, w, h }) : b,
  );
  return { ...layout, blocks: normalize(blocks, id) };
}

export function addBlock(
  layout: ProfileLayout,
  type: ProfileBlockType,
): ProfileLayout {
  if (layout.blocks.some((b) => b.type === type)) return layout;
  const bottom = layout.blocks.reduce((m, b) => Math.max(m, b.y + b.h), 0);
  const size = DEFAULT_SIZE[type];
  const block = clampBlock({ id: type, type, x: 0, y: bottom, ...size });
  return { ...layout, blocks: normalize([...layout.blocks, block]) };
}

export function removeBlock(layout: ProfileLayout, id: string): ProfileLayout {
  return {
    ...layout,
    blocks: compactVertical(layout.blocks.filter((b) => b.id !== id)),
  };
}

/**
 * Validate anything (DB jsonb, localStorage, request body) into a safe layout.
 * Structural failure falls back to DEFAULT_LAYOUT — a profile can never be
 * bricked by bad layout data (ISA anti-criterion ISC-74).
 */
export function parseLayout(value: unknown): ProfileLayout {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return DEFAULT_LAYOUT;
    }
  }
  if (!value || typeof value !== "object") return DEFAULT_LAYOUT;
  const raw = value as { version?: unknown; blocks?: unknown };
  if (raw.version !== 1 || !Array.isArray(raw.blocks)) return DEFAULT_LAYOUT;

  const seen = new Set<string>();
  const blocks: LayoutBlock[] = [];
  for (const item of raw.blocks) {
    if (!item || typeof item !== "object") continue;
    const b = item as Record<string, unknown>;
    if (
      typeof b.id !== "string" ||
      !BLOCK_TYPES.includes(b.type as ProfileBlockType) ||
      ![b.x, b.y, b.w, b.h].every((n) => typeof n === "number" && Number.isFinite(n))
    ) {
      continue;
    }
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    blocks.push(
      clampBlock({
        id: b.id,
        type: b.type as ProfileBlockType,
        x: b.x as number,
        y: b.y as number,
        w: b.w as number,
        h: b.h as number,
      }),
    );
  }

  if (blocks.length === 0) return DEFAULT_LAYOUT;
  return { version: 1, blocks: normalize(blocks) };
}

export function serializeLayout(layout: ProfileLayout): string {
  return JSON.stringify(layout);
}
