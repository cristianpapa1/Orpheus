/**
 * Track A — artistic schools. One token contract, per-school palettes.
 * CSS [data-school] scopes override the same custom properties; components
 * never change. Site chrome stays Bauhaus — schools skin creator spaces
 * and individually pinned posts only.
 */

export const SCHOOLS = [
  "bauhaus",
  "de-stijl",
  "constructivism",
  "swiss",
  "memphis",
] as const;

export type School = (typeof SCHOOLS)[number];

export const SCHOOL_LABEL: Record<School, string> = {
  bauhaus: "Bauhaus",
  "de-stijl": "De Stijl",
  constructivism: "Constructivism",
  swiss: "Swiss Style",
  memphis: "Memphis",
};

export const SCHOOL_FIGURE: Record<School, string> = {
  bauhaus: "Walter Gropius",
  "de-stijl": "Piet Mondrian",
  constructivism: "Alexander Rodchenko",
  swiss: "Josef Müller-Brockmann",
  memphis: "Ettore Sottsass",
};

export function isSchool(value: unknown): value is School {
  return SCHOOLS.includes(value as School);
}

export function toSchool(value: unknown): School {
  return isSchool(value) ? value : "bauhaus";
}
