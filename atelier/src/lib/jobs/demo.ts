import type { JobPost } from "@atelier/core/jobs/types";

/** Demo job posts for preview mode. One filled — exercises collapse + discovery exclusion. */
export const DEMO_JOBS: JobPost[] = [
  {
    id: "demo-job-1",
    profile_id: "00000000-0000-4000-a000-000000000002",
    poster_handle: "theo",
    poster_name: "Theo Brandt",
    title: "Studio assistant — ceramics",
    discipline: "handmade",
    description:
      "Two days a week in the Wedding studio. Wedging, glazing, kiln loading. Beginners welcome if your hands are serious.",
    location: "Berlin",
    work_mode: "on_site",
    compensation: "€16/h",
    apply_url: null,
    status: "open",
    created_at: "2026-07-08T09:00:00Z",
  },
  {
    id: "demo-job-2",
    profile_id: "00000000-0000-4000-a000-000000000001",
    poster_handle: "ines",
    poster_name: "Inês Almeida",
    title: "Darkroom printer for an edition run",
    discipline: "photography",
    description:
      "30 silver gelatin prints, 40×50, from my negatives. You know fiber paper and you own your mistakes.",
    location: "Lisbon",
    work_mode: "on_site",
    compensation: "€400 per edition",
    apply_url: "https://example.com/apply/darkroom",
    status: "open",
    created_at: "2026-07-05T14:00:00Z",
  },
  {
    id: "demo-job-3",
    profile_id: "00000000-0000-4000-a000-000000000001",
    poster_handle: "ines",
    poster_name: "Inês Almeida",
    title: "Product photography for a ceramics shop",
    discipline: "photography",
    description: "Filled — thanks everyone.",
    location: "",
    work_mode: "remote",
    compensation: "Negotiable",
    apply_url: null,
    status: "filled",
    created_at: "2026-06-20T10:00:00Z",
  },
];
