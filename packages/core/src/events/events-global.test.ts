import { describe, expect, test } from "bun:test";
import { groupEventsByMonth, type EventItem } from "./types";

const ev = (id: string, starts_at: string): EventItem => ({
  id,
  profile_id: "p1",
  title: id,
  description: "",
  starts_at,
  location: "",
  location_type: "venue",
  ticket_url: null,
});

describe("groupEventsByMonth", () => {
  test("groups ascending events by month label, order preserved", () => {
    const groups = groupEventsByMonth([
      ev("a", "2026-07-20T10:00:00Z"),
      ev("b", "2026-07-28T10:00:00Z"),
      ev("c", "2026-08-14T10:00:00Z"),
      ev("d", "2026-09-05T10:00:00Z"),
    ]);
    expect(groups.map((g) => g.label)).toEqual([
      "July 2026",
      "August 2026",
      "September 2026",
    ]);
    expect(groups[0].events.map((e) => e.id)).toEqual(["a", "b"]);
  });

  test("empty input yields no groups; invalid dates dropped", () => {
    expect(groupEventsByMonth([])).toEqual([]);
    expect(groupEventsByMonth([ev("x", "garbage")])).toEqual([]);
  });
});
