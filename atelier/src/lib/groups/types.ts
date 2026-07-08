export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_private: boolean;
  created_by: string;
  member_count: number;
  follower_count: number;
}

export interface GroupMember {
  profile_id: string;
  handle: string;
  display_name: string;
  role: "owner" | "member";
}

/** The viewer's relationship to a group — drives every control on the page. */
export type GroupRelation =
  | "owner"
  | "member"
  | "follower"
  | "invited"
  | "requested"
  | "none";

/** A post's group tags, as shown by the "also in [group]" feed marker. */
export interface GroupTag {
  slug: string;
  name: string;
}

export const GROUP_SLUG_RE = /^[a-z0-9-]{3,60}$/;

export function slugifyGroupName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
