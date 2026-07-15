/** Money helpers — integer cents in, formatted string out. Pure, testable. */

export const MAX_PRICE_CENTS = 100_000_00; // $100,000 sanity cap

export function formatMoney(cents: number, currency = "usd"): string {
  const amount = (Number.isFinite(cents) ? cents : 0) / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

/** Parse a user-typed price ("19", "19.99", "$1,999.00") into integer cents,
 *  or null if it isn't a valid non-negative amount within the cap. */
export function parsePriceToCents(input: string): number | null {
  const cleaned = String(input).replace(/[^0-9.]/g, "");
  if (cleaned === "" || (cleaned.match(/\./g)?.length ?? 0) > 1) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  const cents = Math.round(n * 100);
  return cents > MAX_PRICE_CENTS ? null : cents;
}
