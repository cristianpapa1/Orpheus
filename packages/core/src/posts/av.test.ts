import { describe, expect, test } from "bun:test";
import { formatDuration, validDuration } from "./types";

describe("validDuration", () => {
  test("image posts must have no duration", () => {
    expect(validDuration("image", null)).toBe(true);
    expect(validDuration("image", 10)).toBe(false);
  });

  test("video capped at 120s", () => {
    expect(validDuration("video", 30)).toBe(true);
    expect(validDuration("video", 120)).toBe(true);
    expect(validDuration("video", 121)).toBe(false);
    expect(validDuration("video", null)).toBe(false);
    expect(validDuration("video", 0)).toBe(false);
    expect(validDuration("video", Number.NaN)).toBe(false);
  });

  test("audio capped at 300s", () => {
    expect(validDuration("audio", 299)).toBe(true);
    expect(validDuration("audio", 301)).toBe(false);
  });
});

describe("formatDuration", () => {
  test("renders m:ss", () => {
    expect(formatDuration(75)).toBe("1:15");
    expect(formatDuration(9)).toBe("0:09");
    expect(formatDuration(null)).toBe("");
  });
});
