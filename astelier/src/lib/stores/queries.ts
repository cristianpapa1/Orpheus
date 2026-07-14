import { createServerSupabase } from "@/lib/supabase/server";
import { publicMediaUrl } from "@/lib/media";
import { toStoreAccent, type Store } from "@atelier/core/commerce/stores";
import { toSchool } from "@atelier/core/design/schools";

/* Store reads. Defensive: if the astelier_stores table isn't there yet (migration
   not applied), every read reports "no store" rather than throwing. */

const STORE_COLUMNS =
  "id, owner_id, name, slug, description, banner_path, accent, school, is_active";

type StoreRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_path: string | null;
  accent: string | null;
  school: string | null;
  is_active: boolean;
};

function toStore(row: StoreRow): Store {
  return {
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    banner_url: row.banner_path ? publicMediaUrl(row.banner_path) : null,
    accent: toStoreAccent(row.accent),
    school: toSchool(row.school),
    is_active: row.is_active,
  };
}

/** The signed-in user's own store (active or not), or null. */
export async function getMyStore(): Promise<Store | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("astelier_stores")
    .select(STORE_COLUMNS)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return toStore(data as StoreRow);
}

/** A public, active store by slug, or null. */
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("astelier_stores")
    .select(STORE_COLUMNS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  return toStore(data as StoreRow);
}
