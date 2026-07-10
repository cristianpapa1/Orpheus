import type { ProfileLayout } from "./layout";

export interface ProfileLink {
  label: string;
  url: string;
}

import type { School } from "../design/schools";

export type ProfileAccent = "red" | "blue" | "yellow";

export interface ProfileIdentity {
  display_name: string;
  handle: string;
  bio: string;
  avatar_url?: string | null;
  links: ProfileLink[];
  /** The owner's accent — colors their bio window (personalization depth). */
  accent: ProfileAccent;
  /** The artistic school this creator's space converges to (Track A). */
  school: School;
}

export interface PublicProfile extends ProfileIdentity {
  id: string;
  layout: ProfileLayout;
  follower_count: number;
}

export const HANDLE_RE = /^[a-z0-9_]{3,30}$/;

/** Validate anything into a safe links list — bad entries are dropped. */
export function parseLinks(value: unknown): ProfileLink[] {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  const links: ProfileLink[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const l = item as Record<string, unknown>;
    if (typeof l.label !== "string" || typeof l.url !== "string") continue;
    const label = l.label.trim().slice(0, 60);
    const url = l.url.trim();
    if (!label || !/^https?:\/\//i.test(url)) continue;
    links.push({ label, url });
    if (links.length >= 12) break;
  }
  return links;
}
