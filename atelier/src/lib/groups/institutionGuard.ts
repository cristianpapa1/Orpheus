/**
 * Institution-name protection for group creation.
 *
 * A group whose name contains an institution's name may only be created by that
 * institution (or its manager) — nobody else can impersonate "The New Yorker",
 * "Tate", etc. in a group name. Matching is whole-word/phrase (boundary-aware),
 * so an institution name is caught anywhere in the group name WITHOUT snagging
 * incidental letters ("Tate" won't trip on "estate", "The Moth" won't trip on
 * "smooth"). Pure + isomorphic so the server action and tests share one source.
 */

export interface InstitutionRef {
  id: string;
  display_name: string | null;
  managed_by: string | null;
}

/** Protected forms of a name: the full name, plus a de-articled variant
 *  ("The New Yorker" → also "New Yorker") when that variant is distinctive. */
export function protectedTerms(displayName: string): string[] {
  const n = displayName.trim().toLowerCase();
  if (n.length < 3) return [];
  const terms = new Set<string>([n]);
  const noArticle = n.replace(/^(the|a|an|le|la|les)\s+/, "");
  if (noArticle !== n && noArticle.length >= 5) terms.add(noArticle);
  return [...terms];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True when `term` appears in `groupName` as a whole word/phrase. */
export function nameContainsTerm(groupName: string, term: string): boolean {
  if (!term) return false;
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(term)}([^\\p{L}\\p{N}]|$)`, "iu");
  return re.test(groupName);
}

/**
 * The institution whose protected name appears in `groupName` and which
 * `creatorId` is NOT authorized to represent, or null if the name is clear.
 * Authorized = the institution's own account, or the account that manages it.
 */
export function conflictingInstitution(
  groupName: string,
  creatorId: string,
  institutions: InstitutionRef[],
): InstitutionRef | null {
  for (const inst of institutions) {
    const authorized =
      creatorId === inst.id || (inst.managed_by !== null && creatorId === inst.managed_by);
    if (authorized) continue;
    for (const term of protectedTerms(inst.display_name ?? "")) {
      if (nameContainsTerm(groupName, term)) return inst;
    }
  }
  return null;
}
