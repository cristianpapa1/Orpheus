/**
 * Discipline tags — the vocabulary groups declare and discovery filters on.
 * Built from the post taxonomy: one tag per category (`cat:<c>`) plus one per
 * subcategory (`sub:<c>:<s>`), so a group can be "Visual Art", "Painting",
 * "Sculpture", "Journalism", "Woodwork", etc. Pure, no I/O.
 */
import {
  CATEGORY_LABEL,
  POST_CATEGORIES,
  subcategoriesFor,
  subcategoryLabel,
} from "../posts/types";

export interface DisciplineOption {
  value: string;
  label: string;
  /** The base category this discipline belongs to (for grouped filters). */
  category: string;
  /** true for the coarse `cat:*` tag, false for a finer `sub:*` tag. */
  isCategory: boolean;
}

export const DISCIPLINE_OPTIONS: DisciplineOption[] = POST_CATEGORIES.flatMap(
  (c) => [
    { value: `cat:${c}`, label: CATEGORY_LABEL[c], category: c, isCategory: true },
    ...subcategoriesFor(c).map((s) => ({
      value: `sub:${c}:${s}`,
      label: subcategoryLabel(s),
      category: c,
      isCategory: false,
    })),
  ],
);

const DISCIPLINE_VALUES = new Set(DISCIPLINE_OPTIONS.map((o) => o.value));
const DISCIPLINE_LABEL_BY_VALUE = new Map(
  DISCIPLINE_OPTIONS.map((o) => [o.value, o.label]),
);

/** Validate a list of discipline tags against the known vocabulary. */
export function parseDisciplines(value: unknown): string[] {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of value) {
    if (typeof v !== "string" || !DISCIPLINE_VALUES.has(v) || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= 12) break;
  }
  return out;
}

export function disciplineLabel(value: string): string {
  return DISCIPLINE_LABEL_BY_VALUE.get(value) ?? value;
}

/** The base category of a tag: `cat:visual` → visual, `sub:visual:painting` → visual. */
export function disciplineCategory(value: string): string {
  const parts = value.split(":");
  return parts[0] === "cat" ? parts[1] : parts[0] === "sub" ? parts[1] : value;
}

/**
 * Whether a group's discipline tags match a filter tag. Filtering by a coarse
 * `cat:*` also matches any of that category's `sub:*` tags; filtering by a fine
 * `sub:*` matches exactly.
 */
export function disciplinesMatch(groupTags: string[], filter: string): boolean {
  if (groupTags.includes(filter)) return true;
  if (filter.startsWith("cat:")) {
    const cat = disciplineCategory(filter);
    return groupTags.some((t) => disciplineCategory(t) === cat);
  }
  return false;
}
