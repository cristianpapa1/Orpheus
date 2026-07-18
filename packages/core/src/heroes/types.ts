/**
 * Heroes — ephemeral vertical short video ("just for one day"). Shared
 * constants + pure helpers, safe for both the web app and the future Expo
 * pipeline. No I/O here.
 */

/** A Hero clip is a short: capped well under the 2-minute post-video limit. */
export const HERO_MAX_SECONDS = 90;

/** Caption length cap (matches the DB check on heroes.caption). */
export const HERO_CAPTION_MAX = 600;

/** How long a Hero lives before it vanishes. */
export const HERO_TTL_HOURS = 24;

export function validHeroDuration(seconds: number | null | undefined): boolean {
  return typeof seconds === "number" && seconds > 0 && seconds <= HERO_MAX_SECONDS;
}

/**
 * Time left before a Hero expires, as { hours, minutes }. Returns null once the
 * clip has expired. `now` is injectable so callers stay deterministic/testable.
 */
export function heroTimeLeft(
  expiresAtIso: string,
  now: number = Date.now(),
): { hours: number; minutes: number } | null {
  const ms = new Date(expiresAtIso).getTime() - now;
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

/** Compact countdown label, e.g. "12h" or "34m" (under an hour). */
export function heroCountdown(expiresAtIso: string, now: number = Date.now()): string {
  const left = heroTimeLeft(expiresAtIso, now);
  if (!left) return "0m";
  return left.hours > 0 ? `${left.hours}h` : `${left.minutes}m`;
}
