import type { EventItem } from "./types";

/** Demo events for preview mode. Inês has upcoming + past; Theo one upcoming. */
export const DEMO_EVENTS: Record<string, EventItem[]> = {
  "00000000-0000-4000-a000-000000000002": [
    {
      id: "demo-event-4",
      profile_id: "00000000-0000-4000-a000-000000000002",
      title: "Kiln opening — autumn firing",
      description: "First look at the new batch, straight from the kiln.",
      starts_at: "2026-09-05T16:00:00Z",
      location: "Wedding, Berlin",
      location_type: "venue",
      ticket_url: null,
    },
  ],
  "00000000-0000-4000-a000-000000000001": [
    {
      id: "demo-event-1",
      profile_id: "00000000-0000-4000-a000-000000000001",
      title: "Open darkroom night",
      description: "Bring a roll, leave with prints. Chemicals provided.",
      starts_at: "2026-07-20T19:00:00Z",
      location: "Marvila, Lisbon",
      location_type: "venue",
      ticket_url: "https://example.com/tickets/darkroom-night",
    },
    {
      id: "demo-event-2",
      profile_id: "00000000-0000-4000-a000-000000000001",
      title: "Silver Halides — print fair table",
      description: "Selling small editions of the Fira series.",
      starts_at: "2026-08-14T10:00:00Z",
      location: "LX Factory, Lisbon",
      location_type: "venue",
      ticket_url: "https://example.com/tickets/print-fair",
    },
    {
      id: "demo-event-3",
      profile_id: "00000000-0000-4000-a000-000000000001",
      title: "Fira — gallery opening",
      description: "The full series, framed.",
      starts_at: "2026-05-02T18:00:00Z",
      location: "Online walkthrough",
      location_type: "online",
      ticket_url: null,
    },
  ],
};
