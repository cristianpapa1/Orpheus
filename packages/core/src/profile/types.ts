import type { ProfileLayout } from "./layout";
import type { School } from "../design/schools";
import { POST_CATEGORIES, CATEGORY_LABEL } from "../posts/types";

/* ── Contact information (was "Links") ───────────────────────────────
   A profile's public contact list. Each entry is typed so the owner can
   surface a website, an email, a phone, or a mailing address — the user
   picks the kind. The DB keeps this in the same `links` jsonb column. */

export type ContactKind = "link" | "email" | "phone" | "address";

export const CONTACT_KINDS: ContactKind[] = ["link", "email", "phone", "address"];

export const CONTACT_KIND_LABEL: Record<ContactKind, string> = {
  link: "Link",
  email: "Email",
  phone: "Phone",
  address: "Address",
};

export interface ContactEntry {
  kind: ContactKind;
  label: string;
  value: string;
}

/* ── Account type (individual vs institution) ────────────────────────
   Institutions are museums, galleries, publishers, journals, labels,
   theaters, festivals, collectives, podcasts, schools, studios. They are
   ordinary profiles with more affordances — never a paywalled tier. */

export type AccountType = "individual" | "institution";

export type InstitutionKind =
  | "museum"
  | "gallery"
  | "publisher"
  | "journal"
  | "label"
  | "theater"
  | "festival"
  | "collective"
  | "podcast"
  | "school"
  | "studio"
  | "other";

export const INSTITUTION_KINDS: InstitutionKind[] = [
  "museum",
  "gallery",
  "publisher",
  "journal",
  "label",
  "theater",
  "festival",
  "collective",
  "podcast",
  "school",
  "studio",
  "other",
];

export const INSTITUTION_KIND_LABEL: Record<InstitutionKind, string> = {
  museum: "Museum",
  gallery: "Gallery",
  publisher: "Publisher / Press",
  journal: "Journal / Magazine",
  label: "Record label",
  theater: "Theater company",
  festival: "Festival",
  collective: "Collective",
  podcast: "Podcast",
  school: "School / Academy",
  studio: "Studio",
  other: "Other institution",
};

export function isInstitutionKind(value: unknown): value is InstitutionKind {
  return INSTITUTION_KINDS.includes(value as InstitutionKind);
}

export interface ProfileIdentity {
  display_name: string;
  handle: string;
  bio: string;
  avatar_url?: string | null;
  /** Typed contact entries (website, email, phone, address). */
  contacts: ContactEntry[];
  /** The owner's accent — colors their bio window (personalization depth). */
  accent: ProfileAccent;
  /** The artistic school this creator's space converges to (Track A). */
  school: School;
  /** Individual person or an institution. */
  account_type: AccountType;
  /** Kind of institution — null for individuals. */
  institution_kind: InstitutionKind | null;
  /** Interest tags (prefixed `cat:` / `school:`) — drive group discovery. */
  interests: string[];
}

export type ProfileAccent = "red" | "blue" | "yellow";

export interface PublicProfile extends ProfileIdentity {
  id: string;
  layout: ProfileLayout;
  follower_count: number;
}

export const HANDLE_RE = /^[a-z0-9_]{3,30}$/;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-.\s]{5,30}$/;

/** Normalize a single contact entry, or null if it is not valid. */
function parseContact(raw: unknown): ContactEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  // Legacy row: { label, url } → a link.
  const kindRaw =
    typeof r.kind === "string" ? r.kind : r.url !== undefined ? "link" : "";
  if (!CONTACT_KINDS.includes(kindRaw as ContactKind)) return null;
  const kind = kindRaw as ContactKind;

  const rawValue = typeof r.value === "string" ? r.value : r.url;
  if (typeof rawValue !== "string") return null;
  const value = rawValue.trim();
  const label = (typeof r.label === "string" ? r.label : "").trim().slice(0, 60);
  if (!value) return null;

  switch (kind) {
    case "link":
      if (!/^https?:\/\//i.test(value)) return null;
      break;
    case "email":
      if (!EMAIL_RE.test(value)) return null;
      break;
    case "phone":
      if (!PHONE_RE.test(value)) return null;
      break;
    case "address":
      if (value.length > 200) return null;
      break;
  }
  return { kind, label: label || CONTACT_KIND_LABEL[kind], value };
}

/** Validate anything into a safe contact list — bad entries are dropped. */
export function parseContacts(value: unknown): ContactEntry[] {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  const out: ContactEntry[] = [];
  for (const item of value) {
    const entry = parseContact(item);
    if (entry) out.push(entry);
    if (out.length >= 12) break;
  }
  return out;
}

/** The href a contact entry links to (mailto:/tel:/https). */
export function contactHref(entry: ContactEntry): string {
  switch (entry.kind) {
    case "email":
      return `mailto:${entry.value}`;
    case "phone":
      return `tel:${entry.value.replace(/[^0-9+]/g, "")}`;
    case "address":
      return `https://maps.google.com/?q=${encodeURIComponent(entry.value)}`;
    default:
      return entry.value;
  }
}

/* ── Interests (onboarding chips → group discovery) ──────────────────
   The shared vocabulary: every post category plus every artistic school.
   Values are prefixed so `cat:music` never collides with `school:swiss`. */

export interface InterestOption {
  value: string;
  label: string;
  group: "Discipline";
}

export const INTEREST_OPTIONS: InterestOption[] = [
  ...POST_CATEGORIES.map((c) => ({
    value: `cat:${c}`,
    label: CATEGORY_LABEL[c],
    group: "Discipline" as const,
  })),
];

const INTEREST_VALUES = new Set(INTEREST_OPTIONS.map((o) => o.value));
const INTEREST_LABEL_BY_VALUE = new Map(
  INTEREST_OPTIONS.map((o) => [o.value, o.label]),
);

/** Human labels for a list of interest values (unknown values dropped). */
export function interestLabels(values: string[]): string[] {
  const out: string[] = [];
  for (const v of values) {
    const label = INTEREST_LABEL_BY_VALUE.get(v);
    if (label) out.push(label);
  }
  return out;
}

/** Validate an interests array against the known vocabulary. */
export function parseInterests(value: unknown): string[] {
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
    if (typeof v !== "string" || !INTEREST_VALUES.has(v) || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= 24) break;
  }
  return out;
}

export function accountType(value: unknown): AccountType {
  return value === "institution" ? "institution" : "individual";
}
