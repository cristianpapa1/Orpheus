import { describe, expect, test } from "bun:test";
import { formatMoney, parseEurosToCents, progressPct } from "./types";

describe("formatMoney", () => {
  test("formats cents as fixed-locale euros", () => {
    expect(formatMoney(1250)).toBe("€12.50");
    expect(formatMoney(300)).toBe("€3.00");
  });
});

describe("progressPct", () => {
  test("computes and clamps progress", () => {
    expect(progressPct(22000, 60000)).toBe(37);
    expect(progressPct(90000, 60000)).toBe(100);
    expect(progressPct(-5, 60000)).toBe(0);
  });

  test("null or zero goal yields null (no bar)", () => {
    expect(progressPct(1000, null)).toBeNull();
    expect(progressPct(1000, 0)).toBeNull();
  });
});

describe("parseEurosToCents", () => {
  test("accepts dot and comma decimals", () => {
    expect(parseEurosToCents("12.50")).toBe(1250);
    expect(parseEurosToCents("12,50")).toBe(1250);
    expect(parseEurosToCents("5")).toBe(500);
  });

  test("rejects invalid, zero, negative, and absurd amounts", () => {
    expect(parseEurosToCents("abc")).toBeNull();
    expect(parseEurosToCents("0")).toBeNull();
    expect(parseEurosToCents("-4")).toBeNull();
    expect(parseEurosToCents("99999")).toBeNull();
  });
});
