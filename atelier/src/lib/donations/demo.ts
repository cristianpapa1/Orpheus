import type { Appeal, AppealResults, DonationEntry } from "./types";

/** Demo appeal + ledger for preview mode. */

export const DEMO_APPEAL: Appeal = {
  id: "20000000-0000-4000-a000-000000000001",
  title: "Q3 server & storage costs",
  message:
    "Hosting, image storage, and the database bill for the next quarter. When we hit the goal this banner disappears.",
  goal_cents: 60000,
  audience: "everyone",
  active: true,
  created_at: "2026-07-01T09:00:00Z",
};

export const DEMO_APPEAL_RESULTS: AppealResults = {
  ...DEMO_APPEAL,
  raised_cents: 22000,
  donation_count: 17,
  reach: 412,
};

export const DEMO_LEDGER: DonationEntry[] = [
  {
    id: "demo-don-1",
    amount_cents: 2500,
    currency: "eur",
    kind: "recurring",
    status: "succeeded",
    donor_label: "@theo",
    created_at: "2026-07-08T10:00:00Z",
  },
  {
    id: "demo-don-2",
    amount_cents: 1000,
    currency: "eur",
    kind: "one_off",
    status: "succeeded",
    donor_label: "anonymous",
    created_at: "2026-07-07T18:30:00Z",
  },
  {
    id: "demo-don-3",
    amount_cents: 500,
    currency: "eur",
    kind: "one_off",
    status: "succeeded",
    donor_label: "@ines",
    created_at: "2026-07-05T12:15:00Z",
  },
  {
    id: "demo-don-4",
    amount_cents: 300,
    currency: "eur",
    kind: "recurring",
    status: "succeeded",
    donor_label: "anonymous",
    created_at: "2026-07-02T08:00:00Z",
  },
];
