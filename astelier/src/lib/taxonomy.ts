import { CATEGORIES, styleCanonicalLabel } from "@atelier/core/taxonomy/taxonomy";
import { localizedCategoryLabel } from "@atelier/core/taxonomy/i18n";

export interface DisciplineChip {
  /** "cat:<id>" — matches how products store `disciplines[]` (browse filters
   *  `disciplines contains cat:<id>`), so the convention is preserved. */
  value: string;
  label: string;
}

/** Category chips for the viewer's locale, from the shared taxonomy. */
export function categoryChips(locale: string): DisciplineChip[] {
  return CATEGORIES.map((c) => ({
    value: `cat:${c.id}`,
    label: localizedCategoryLabel(c.id, locale),
  }));
}

/** Label for a stored discipline value ("cat:<id>" / "sub:<id>"), localized;
 *  falls back to the raw value so legacy tags never render blank. */
export function disciplineLabel(value: string, locale: string): string {
  if (value.startsWith("cat:")) return localizedCategoryLabel(value.slice(4), locale);
  if (value.startsWith("sub:")) return styleCanonicalLabel("", value.slice(4));
  return value;
}
