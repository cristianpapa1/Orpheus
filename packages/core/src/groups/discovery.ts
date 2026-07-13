/**
 * Group discovery — pure, no I/O. Ranks groups by how strongly their name and
 * description echo a person's interest labels, so onboarding can point a new
 * member at groups they'll actually care about. No ranking of the main feed
 * happens here — this is discovery, not distribution.
 */

export interface DiscoverableGroup {
  id: string;
  name: string;
  description: string;
}

/** Base category of a discipline/interest tag: cat:x → x, sub:x:y → x. */
function baseCategory(tag: string): string {
  const p = tag.split(":");
  return p[0] === "cat" || p[0] === "sub" ? (p[1] ?? "") : "";
}

/**
 * Suggest groups whose disciplines overlap the viewer's interests, by shared
 * base category (a `cat:music` interest matches a group tagged `sub:music:jazz`).
 * Exact — no keyword guessing. Falls back to nothing when there's no overlap.
 */
export function suggestGroupsByInterests<
  T extends { id: string; name: string; interests: string[] },
>(
  groups: T[],
  userInterests: string[],
  options: { limit?: number; exclude?: Iterable<string> } = {},
): T[] {
  const { limit = 6, exclude } = options;
  const cats = new Set(userInterests.map(baseCategory).filter(Boolean));
  if (cats.size === 0) return [];
  const excluded = new Set(exclude ?? []);

  return groups
    .filter((g) => !excluded.has(g.id))
    .map((g) => {
      const groupCats = new Set(g.interests.map(baseCategory).filter(Boolean));
      let score = 0;
      for (const c of groupCats) if (cats.has(c)) score += 1;
      return { g, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.g.name.localeCompare(b.g.name))
    .slice(0, Math.max(0, limit))
    .map((x) => x.g);
}

/**
 * Suggest up to `limit` groups matching the given interest labels. A group
 * scores one point per interest label that appears (case-insensitive) in its
 * name or description; ties break by name for a stable, non-random order.
 * Groups the viewer already belongs to can be excluded via `exclude`.
 */
export function suggestGroups<T extends DiscoverableGroup>(
  groups: T[],
  interestLabels: string[],
  options: { limit?: number; exclude?: Iterable<string> } = {},
): T[] {
  const { limit = 6, exclude } = options;
  const terms = interestLabels
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean);
  if (terms.length === 0) return [];
  const excluded = new Set(exclude ?? []);

  return groups
    .filter((g) => !excluded.has(g.id))
    .map((g) => {
      const hay = `${g.name} ${g.description}`.toLowerCase();
      const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
      return { group: g, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.group.name.localeCompare(b.group.name))
    .slice(0, Math.max(0, limit))
    .map((x) => x.group);
}
