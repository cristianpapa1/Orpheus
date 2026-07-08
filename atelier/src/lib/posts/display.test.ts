import { describe, expect, test } from "bun:test";
import {
  ASPECTS,
  DEFAULT_DISPLAY,
  FRAMES,
  SPANS,
  aspectClass,
  frameClasses,
  parseDisplay,
  spanClass,
} from "./display";

describe("display presets", () => {
  test("bold options, not one toggle: ≥3 frames, ≥3 spans, ≥4 aspects", () => {
    expect(FRAMES.length).toBeGreaterThanOrEqual(3);
    expect(SPANS.length).toBeGreaterThanOrEqual(3);
    expect(ASPECTS.length).toBeGreaterThanOrEqual(4);
  });
});

describe("parseDisplay", () => {
  test("garbage falls back to defaults", () => {
    expect(parseDisplay("not json")).toEqual(DEFAULT_DISPLAY);
    expect(parseDisplay(null)).toEqual(DEFAULT_DISPLAY);
    expect(parseDisplay(42)).toEqual(DEFAULT_DISPLAY);
  });

  test("partial config keeps valid fields, defaults the rest", () => {
    expect(parseDisplay({ span: "full", frame: "nonsense" })).toEqual({
      ...DEFAULT_DISPLAY,
      span: "full",
    });
  });

  test("round-trips a full valid config (JSON string too)", () => {
    const config = { frame: "plate", span: "wide", aspect: "square" } as const;
    expect(parseDisplay(config)).toEqual(config);
    expect(parseDisplay(JSON.stringify(config))).toEqual(config);
  });
});

describe("class mappers", () => {
  test("every span maps to a col-span class, full spans the row", () => {
    for (const span of SPANS) {
      expect(spanClass(span)).toContain("col-span-12");
    }
    expect(spanClass("full")).toBe("col-span-12");
    expect(spanClass("wide")).toContain("md:col-span-7");
  });

  test("every aspect maps; natural is uncropped", () => {
    expect(aspectClass("natural")).toBe("");
    expect(aspectClass("square")).toContain("aspect-square");
    expect(aspectClass("landscape")).toContain("object-cover");
    expect(aspectClass("portrait")).toContain("aspect-[3/4]");
  });

  test("every frame maps to distinct treatments", () => {
    const treatments = FRAMES.map((f) => JSON.stringify(frameClasses(f)));
    expect(new Set(treatments).size).toBe(FRAMES.length);
    expect(frameClasses("plate").wrapper).toContain("bg-ink");
    expect(frameClasses("inset").image).toContain("border-ink");
  });
});
