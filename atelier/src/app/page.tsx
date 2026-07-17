import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getRecentPosts } from "@/lib/posts/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { thumbUrl } from "@atelier/core/posts/types";
import { Landing, type StripItem } from "@/components/landing/Landing";
import { getI18n } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "À un flâneur — a space for people who make things",
  description:
    "Art, photography, handmade, music, words — a community-first platform for creators. No ads, no pay-to-be-seen.",
};

/**
 * The apex landing. Logged-in visitors fall straight through to their feed;
 * everyone else gets the public front door. A strip of real recent work proves
 * the place is alive.
 */
export default async function Home() {
  const supabase = await createServerSupabase();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/feed");
  }

  const recent = await getRecentPosts(30);
  const strip: StripItem[] = recent
    .filter((p) => p.media_type === "image")
    .slice(0, 12)
    .map((p) => ({
      id: p.id,
      src: thumbUrl(p),
      alt: p.alt_text || p.caption || `Work by ${p.author_name}`,
      author: p.author_name,
    }));

  const { t } = await getI18n();
  return (
    <Landing
      strip={strip}
      configured={isSupabaseConfigured()}
      L={t.landing}
      footer={t.footer}
      signIn={t.nav.signIn}
    />
  );
}
