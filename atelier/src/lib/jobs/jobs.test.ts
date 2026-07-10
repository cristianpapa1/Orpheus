import { describe, expect, test } from "bun:test";
import { filterJobs, type JobPost } from "./types";

const job = (partial: Partial<JobPost>): JobPost => ({
  id: "j1",
  profile_id: "p1",
  poster_handle: "ines",
  poster_name: "Inês",
  title: "A job",
  discipline: "photography",
  description: "",
  location: "Lisbon",
  work_mode: "on_site",
  compensation: "Negotiable",
  apply_url: null,
  status: "open",
  created_at: "2026-07-01T00:00:00Z",
  ...partial,
});

const JOBS = [
  job({ id: "a", discipline: "photography", work_mode: "on_site" }),
  job({ id: "b", discipline: "handmade", work_mode: "on_site" }),
  job({ id: "c", discipline: "photography", work_mode: "remote" }),
];

describe("filterJobs", () => {
  test("no filters returns everything", () => {
    expect(filterJobs(JOBS, {}).length).toBe(3);
  });

  test("filters by discipline", () => {
    expect(filterJobs(JOBS, { discipline: "photography" }).map((j) => j.id)).toEqual(
      ["a", "c"],
    );
  });

  test("filters by work mode", () => {
    expect(filterJobs(JOBS, { mode: "remote" }).map((j) => j.id)).toEqual(["c"]);
  });

  test("combines filters", () => {
    expect(
      filterJobs(JOBS, { discipline: "photography", mode: "on_site" }).map((j) => j.id),
    ).toEqual(["a"]);
  });

  test("invalid filter values are ignored (no filter)", () => {
    expect(filterJobs(JOBS, { discipline: "nonsense", mode: "banana" }).length).toBe(3);
  });
});
