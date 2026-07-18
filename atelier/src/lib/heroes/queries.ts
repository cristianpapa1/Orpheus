import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { publicMediaUrl } from "@/lib/posts/queries";

export interface HeroItem {
  id: string;
  media_url: string;
  poster_url: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number;
  caption: string;
  alt_text: string | null;
  created_at: string;
  expires_at: string;
  author_id: string;
  author_handle: string;
  author_name: string;
  author_avatar_url: string | null;
  event_id: string | null;
  event_title: string | null;
  favorites: number;
  liked: boolean;
  views: number;
}

interface HeroRow {
  id: string;
  media_path: string;
  poster_path: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number;
  caption: string;
  alt_text: string | null;
  created_at: string;
  expires_at: string;
  author_id: string;
  event_id: string | null;
  author: { handle: string | null; display_name: string | null; avatar_url: string | null } | null;
  event: { title: string | null } | null;
}

type Supa = NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;

const NIL = "00000000-0000-0000-0000-000000000000";

// Explicit author FK: hero_favorites/hero_views also link heroes↔profiles, so a
// bare `profiles` embed would be ambiguous (PGRST201). event embed is single-FK.
const HERO_SELECT =
  "id, media_path, poster_path, width, height, duration_seconds, caption, alt_text, created_at, expires_at, author_id, event_id, author:profiles!heroes_author_id_fkey(handle, display_name, avatar_url), event:events(title)";

/** Attach like/view counts (and the viewer's like) to a page of Hero rows. */
async function hydrate(supabase: Supa, rows: HeroRow[], userId: string | null): Promise<HeroItem[]> {
  const ids = rows.map((r) => r.id);
  const inIds = ids.length ? ids : [NIL];
  const [favRes, viewRes] = await Promise.all([
    supabase.from("hero_favorites").select("hero_id, profile_id").in("hero_id", inIds),
    supabase.from("hero_views").select("hero_id").in("hero_id", inIds),
  ]);

  const favCount = new Map<string, number>();
  const liked = new Set<string>();
  for (const r of favRes.data ?? []) {
    favCount.set(r.hero_id, (favCount.get(r.hero_id) ?? 0) + 1);
    if (userId && r.profile_id === userId) liked.add(r.hero_id);
  }
  const viewCount = new Map<string, number>();
  for (const r of viewRes.data ?? []) {
    viewCount.set(r.hero_id, (viewCount.get(r.hero_id) ?? 0) + 1);
  }

  return rows.map((r) => ({
    id: r.id,
    media_url: publicMediaUrl(r.media_path),
    poster_url: r.poster_path ? publicMediaUrl(r.poster_path) : null,
    width: r.width,
    height: r.height,
    duration_seconds: r.duration_seconds,
    caption: r.caption,
    alt_text: r.alt_text,
    created_at: r.created_at,
    expires_at: r.expires_at,
    author_id: r.author_id,
    author_handle: r.author?.handle ?? "",
    author_name: r.author?.display_name ?? r.author?.handle ?? "Unnamed",
    author_avatar_url: r.author?.avatar_url ?? null,
    event_id: r.event_id,
    event_title: r.event?.title ?? null,
    favorites: favCount.get(r.id) ?? 0,
    liked: liked.has(r.id),
    views: viewCount.get(r.id) ?? 0,
  }));
}

/**
 * Live Heroes (expires_at in the future), newest first, with author, optional
 * event, and the viewer's like + counts. Defensive: [] pre-migration / preview.
 */
export async function getLiveHeroes(limit = 40): Promise<HeroItem[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("heroes")
    .select(HERO_SELECT)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return hydrate(supabase, data as unknown as HeroRow[], user?.id ?? null);
}

/** Live Heroes tied to a specific event — the event-detail shelf. */
export async function getHeroesForEvent(eventId: string, limit = 30): Promise<HeroItem[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("heroes")
    .select(HERO_SELECT)
    .eq("event_id", eventId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return hydrate(supabase, data as unknown as HeroRow[], user?.id ?? null);
}
