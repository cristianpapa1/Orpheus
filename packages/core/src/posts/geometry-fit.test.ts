import { describe, expect, test } from "bun:test";
import { MAX_DISPLAY_EDGE, fitWithin } from "./geometry";

describe("fitWithin", () => {
  test("leaves small images untouched", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  test("caps landscape longest edge at the max", () => {
    const { width, height } = fitWithin(4000, 3000);
    expect(width).toBe(MAX_DISPLAY_EDGE);
    expect(height).toBe(1200);
  });

  test("caps portrait longest edge at the max", () => {
    const { width, height } = fitWithin(3000, 4000);
    expect(height).toBe(MAX_DISPLAY_EDGE);
    expect(width).toBe(1200);
  });

  test("preserves aspect ratio within rounding", () => {
    const { width, height } = fitWithin(5321, 2377, 1600);
    expect(Math.abs(width / height - 5321 / 2377)).toBeLessThan(0.01);
    expect(Math.max(width, height)).toBe(1600);
  });

  test("square images cap both edges", () => {
    expect(fitWithin(2000, 2000, 1000)).toEqual({ width: 1000, height: 1000 });
  });

  test("never returns zero dimensions", () => {
    const { width, height } = fitWithin(10000, 1, 1600);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  test("zero-size input passes through", () => {
    expect(fitWithin(0, 0)).toEqual({ width: 0, height: 0 });
  });
});
