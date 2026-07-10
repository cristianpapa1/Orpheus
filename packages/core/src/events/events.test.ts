import { describe, expect, test } from "bun:test";
import { formatEventDate, splitEvents, type EventItem } from "./types";

const ev = (id: string, starts_at: string): EventItem => ({
  id,
  profile_id: "p1",
  title: `Event ${id}`,
  description: "",
  starts_at,
  location: "Lisbon",
  location_type: "venue",
  ticket_url: null,
});

const NOW = "2026-07-09T12:00:00Z";

describe("splitEvents", () => {
  test("upcoming are soonest-first, past are most-recent-first", () => {
    const { upcoming, past } = splitEvents(
      [
        ev("far", "2026-09-01T20:00:00Z"),
        ev("old", "2026-01-01T20:00:00Z"),
        ev("soon", "2026-07-20T20:00:00Z"),
        ev("older", "2025-06-01T20:00:00Z"),
      ],
      NOW,
    );
    expect(upcoming.map((e) => e.id)).toEqual(["soon", "far"]);
    expect(past.map((e) => e.id)).toEqual(["old", "older"]);
  });

  test("boundary: an event exactly at now counts as upcoming", () => {
    const { upcoming, past } = splitEvents([ev("edge", NOW)], NOW);
    expect(upcoming.length).toBe(1);
    expect(past.length).toBe(0);
  });

  test("empty input yields empty halves", () => {
    expect(splitEvents([], NOW)).toEqual({ upcoming: [], past: [] });
  });
});

describe("formatEventDate", () => {
  test("fixed locale, UTC-labeled, deterministic", () => {
    expect(formatEventDate("2026-08-14T20:00:00Z")).toBe(
      "Fri, 14 Aug 2026, 20:00 UTC",
    );
  });

  test("invalid date renders empty", () => {
    expect(formatEventDate("garbage")).toBe("");
  });
});
