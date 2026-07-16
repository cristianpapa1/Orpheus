// Pure, isomorphic limits + validation for creator applications. No server
// imports here, so client components (the forms) and server code (the apply
// helper, onboarding action) can share one source of truth.

export const STATEMENT_MIN = 20;
export const STATEMENT_MAX = 2000;
export const MAX_LINKS = 10;

const URL_RE = /^https?:\/\/\S+$/i;

/** Keep valid http(s) links, trimmed, deduped, capped. */
export function cleanCreatorLinks(raw: string[]): string[] {
  const out: string[] = [];
  for (const r of raw) {
    const s = (r ?? "").trim().slice(0, 500);
    if (s && URL_RE.test(s) && !out.includes(s)) out.push(s);
    if (out.length >= MAX_LINKS) break;
  }
  return out;
}
