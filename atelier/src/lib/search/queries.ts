import { createServerSupabase } from "@/lib/supabase/server";
import type { AccountType, InstitutionKind } from "@atelier/core/profile/types";

export interface SearchProfile {
  id: string;
  handle: string;
  display_name: string;
  account_type: AccountType;
  institution_kind: InstitutionKind | null;
}
export interface SearchGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
}
export interface SearchPost {
  id: string;
  caption: string;
  body: string | null;
  media_type: string;
  author_handle: string;
  author_name: string;
}
export interface SearchResults {
  profiles: SearchProfile[];
  groups: SearchGroup[];
  posts: SearchPost[];
}

const EMPTY: SearchResults = { profiles: [], groups: [], posts: [] };

/**
 * Search people, groups, and posts by name/text (case-insensitive substring).
 * Input is sanitized before it reaches the PostgREST `.or` filter so it can't
 * inject filter syntax. Each section tolerates its own error independently.
 */
export async function searchAll(query: string): Promise<SearchResults> {
  const supabase = await createServerSupabase();
  if (!supabase) return EMPTY;

  // Strip characters that would break the PostgREST filter grammar.
  const safe = query.replace(/[%,()*:]/g, " ").trim().slice(0, 80);
  if (safe.length < 2) return EMPTY;
  const pat = `%${safe}%`;

  const [pRes, gRes, postRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, handle, display_name, account_type, institution_kind")
      .not("handle", "is", null)
      .or(`display_name.ilike.${pat},handle.ilike.${pat},bio.ilike.${pat}`)
      .limit(20),
    supabase
      .from("groups")
      .select("id, name, slug, description")
      .or(`name.ilike.${pat},description.ilike.${pat}`)
      .limit(20),
    supabase
      .from("posts")
      .select(
        "id, caption, body, media_type, author:profiles!posts_author_id_fkey(handle, display_name)",
      )
      .or(`caption.ilike.${pat},body.ilike.${pat}`)
      .limit(20),
  ]);

  const profiles: SearchProfile[] = (pRes.error ? [] : (pRes.data ?? [])).map(
    (p) => ({
      id: p.id,
      handle: p.handle ?? "",
      display_name: p.display_name ?? p.handle ?? "Unnamed",
      account_type: p.account_type === "institution" ? "institution" : "individual",
      institution_kind: (p.institution_kind as InstitutionKind | null) ?? null,
    }),
  );

  const groups: SearchGroup[] = (gRes.error ? [] : (gRes.data ?? [])).map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    description: g.description,
  }));

  const posts: SearchPost[] = (
    postRes.error ? [] : ((postRes.data ?? []) as unknown as {
      id: string;
      caption: string;
      body: string | null;
      media_type: string;
      author: { handle: string | null; display_name: string | null } | null;
    }[])
  ).map((p) => ({
    id: p.id,
    caption: p.caption,
    body: p.body,
    media_type: p.media_type,
    author_handle: p.author?.handle ?? "",
    author_name: p.author?.display_name ?? p.author?.handle ?? "Unnamed",
  }));

  return { profiles, groups, posts };
}
