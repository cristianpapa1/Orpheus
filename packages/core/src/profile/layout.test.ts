import { describe, expect, test } from "bun:test";
import {
  DEFAULT_LAYOUT,
  GRID_COLS,
  addBlock,
  clampBlock,
  compactVertical,
  moveBlock,
  parseLayout,
  rectsOverlap,
  removeBlock,
  resizeBlock,
  resolveCollisions,
  serializeLayout,
  type LayoutBlock,
} from "./layout";

const block = (partial: Partial<LayoutBlock>): LayoutBlock => ({
  id: "bio",
  type: "bio",
  x: 0,
  y: 0,
  w: 4,
  h: 2,
  ...partial,
});

const noOverlaps = (blocks: LayoutBlock[]) =>
  blocks.every((a, i) =>
    blocks.slice(i + 1).every((b) => !rectsOverlap(a, b)),
  );

describe("clampBlock", () => {
  test("clamps position inside the grid", () => {
    const b = clampBlock(block({ x: 99, y: -5, w: 4 }));
    expect(b.x).toBe(GRID_COLS - 4);
    expect(b.y).toBe(0);
  });

  test("enforces per-type minimum sizes", () => {
    const b = clampBlock(block({ type: "gallery", id: "gallery", w: 1, h: 0 }));
    expect(b.w).toBeGreaterThanOrEqual(4);
    expect(b.h).toBeGreaterThanOrEqual(2);
  });

  test("caps width at the grid", () => {
    expect(clampBlock(block({ w: 40 })).w).toBe(GRID_COLS);
  });
});

describe("rectsOverlap", () => {
  test("detects overlap", () => {
    expect(rectsOverlap(block({}), block({ id: "b", x: 2, y: 1 }))).toBe(true);
  });
  test("adjacent blocks do not overlap", () => {
    expect(rectsOverlap(block({ w: 4 }), block({ id: "b", x: 4 }))).toBe(false);
  });
});

describe("resolveCollisions", () => {
  test("pushes overlapped blocks down, active keeps position", () => {
    const blocks = [
      block({ id: "a", x: 0, y: 0, w: 6, h: 2 }),
      block({ id: "b", x: 0, y: 0, w: 6, h: 2 }),
    ];
    const resolved = resolveCollisions(blocks, "a");
    expect(resolved.find((b) => b.id === "a")!.y).toBe(0);
    expect(resolved.find((b) => b.id === "b")!.y).toBe(2);
    expect(noOverlaps(resolved)).toBe(true);
  });

  test("chain-pushes stacked blocks", () => {
    const blocks = [
      block({ id: "a", x: 0, y: 0, w: 12, h: 3 }),
      block({ id: "b", x: 0, y: 0, w: 12, h: 2 }),
      block({ id: "c", x: 0, y: 2, w: 12, h: 2 }),
    ];
    expect(noOverlaps(resolveCollisions(blocks, "a"))).toBe(true);
  });
});

describe("compactVertical", () => {
  test("removes vertical gaps", () => {
    const compacted = compactVertical([block({ id: "a", y: 5 })]);
    expect(compacted[0].y).toBe(0);
  });

  test("is idempotent", () => {
    const blocks = [
      block({ id: "a", x: 0, y: 2, w: 6, h: 2 }),
      block({ id: "b", x: 6, y: 4, w: 6, h: 2 }),
    ];
    const once = compactVertical(blocks);
    expect(compactVertical(once)).toEqual(once);
  });
});

describe("moveBlock / resizeBlock", () => {
  test("moveBlock clamps into bounds and stays collision-free", () => {
    const layout = moveBlock(DEFAULT_LAYOUT, "links", 50, -3);
    const links = layout.blocks.find((b) => b.id === "links")!;
    expect(links.x + links.w).toBeLessThanOrEqual(GRID_COLS);
    expect(links.y).toBeGreaterThanOrEqual(0);
    expect(noOverlaps(layout.blocks)).toBe(true);
  });

  test("resizeBlock respects minimums and resolves collisions", () => {
    const layout = resizeBlock(DEFAULT_LAYOUT, "bio", 12, 1);
    const bio = layout.blocks.find((b) => b.id === "bio")!;
    expect(bio.w).toBe(12);
    expect(bio.h).toBeGreaterThanOrEqual(2);
    expect(noOverlaps(layout.blocks)).toBe(true);
  });
});

describe("addBlock / removeBlock", () => {
  test("addBlock appends a new type at the bottom, once", () => {
    const layout = addBlock(DEFAULT_LAYOUT, "events");
    expect(layout.blocks.some((b) => b.type === "events")).toBe(true);
    expect(addBlock(layout, "events").blocks.length).toBe(layout.blocks.length);
    expect(noOverlaps(layout.blocks)).toBe(true);
  });

  test("removeBlock drops and compacts", () => {
    const layout = removeBlock(DEFAULT_LAYOUT, "bio");
    expect(layout.blocks.some((b) => b.id === "bio")).toBe(false);
    expect(compactVertical(layout.blocks)).toEqual(layout.blocks);
  });
});

describe("parseLayout", () => {
  test("garbage string falls back to default", () => {
    expect(parseLayout("not json at all")).toEqual(DEFAULT_LAYOUT);
  });

  test("wrong shape falls back to default", () => {
    expect(parseLayout({ version: 2, blocks: "nope" })).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout(null)).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout(42)).toEqual(DEFAULT_LAYOUT);
  });

  test("invalid blocks are dropped, valid ones clamped", () => {
    const layout = parseLayout({
      version: 1,
      blocks: [
        { id: "bio", type: "bio", x: 99, y: 0, w: 4, h: 2 },
        { id: "bad", type: "nonsense", x: 0, y: 0, w: 2, h: 2 },
        { id: "bio", type: "bio", x: 0, y: 0, w: 4, h: 2 },
      ],
    });
    expect(layout.blocks.length).toBe(1);
    expect(layout.blocks[0].x).toBe(GRID_COLS - 4);
  });

  test("round-trips through serializeLayout", () => {
    expect(parseLayout(serializeLayout(DEFAULT_LAYOUT))).toEqual(DEFAULT_LAYOUT);
  });
});
