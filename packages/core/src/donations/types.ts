export type DonationKind = "one_off" | "recurring";
export type AppealAudience = "everyone" | "past_donors" | "active_users";

export interface Appeal {
  id: string;
  title: string;
  message: string;
  goal_cents: number | null;
  audience: AppealAudience;
  active: boolean;
  created_at: string;
}

export interface AppealResults extends Appeal {
  raised_cents: number;
  donation_count: number;
  reach: number;
}

export interface DonationEntry {
  id: string;
  amount_cents: number;
  currency: string;
  kind: DonationKind;
  status: string;
  donor_label: string; // handle or "anonymous"
  created_at: string;
}

export const DONATION_PRESETS_CENTS = [300, 500, 1000, 2500] as const;

export const AUDIENCE_LABEL: Record<AppealAudience, string> = {
  everyone: "Everyone",
  past_donors: "Past donors",
  active_users: "Active users",
};

/** Cents → "€12.50" (fixed locale — deterministic on server and client). */
export function formatMoney(cents: number, currency = "eur"): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/** Progress toward a goal, clamped 0–100. Null goal → null (no bar). */
export function progressPct(
  raisedCents: number,
  goalCents: number | null,
): number | null {
  if (goalCents === null || goalCents <= 0) return null;
  return Math.min(100, Math.max(0, Math.round((raisedCents / goalCents) * 100)));
}

/** Euros string from a form field → cents int, or null when invalid. */
export function parseEurosToCents(value: string): number | null {
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0 || n > 10000) return null;
  return Math.round(n * 100);
}
