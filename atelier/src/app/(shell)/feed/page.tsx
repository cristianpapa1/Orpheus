import Link from "next/link";
import { PostCard } from "@/components/posts/PostCard";
import { BauhausReveal } from "@/components/BauhausReveal";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getFeedItems } from "@/lib/posts/queries";
import { getGroupsForPosts } from "@/lib/groups/queries";
import { getFavoritesForPosts } from "@/lib/favorites/queries";
import { getCurationsForPosts } from "@/lib/curations/queries";
import { getFollowingRanked, isViewerQualityStamped, getViewerId } from "@/lib/profile/queries";
import { isViewerCurator } from "@/lib/curator/eligibility";
import { getI18n } from "@/lib/i18n/server";

export default async function FeedPage() {
  const { t } = await getI18n();
  const items = await getFeedItems();
  const posts = items.map((it) => it.post);
  const postIds = posts.map((p) => p.id);
  const [groupTags, favs, curs, following, stamped, viewerId, viewerIsCurator] =
    await Promise.all([
      getGroupsForPosts(postIds),
      getFavoritesForPosts(postIds),
      getCurationsForPosts(postIds),
      getFollowingRanked(),
      isViewerQualityStamped(),
      getViewerId(),
      isViewerCurator(),
    ]);

  return (
    <div>
      <BauhausReveal />
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-h1 font-bold uppercase">{t.feed.title}</h1>
        <Link
          href="/post/new"
          data-new-post
          className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-red hover:border-red"
        >
          + {t.feed.newPost}
        </Link>
      </div>

      {posts.length === 0 ? (
        <WindowGrid>
          <Window title={t.feed.title} accent="red" span="col-span-12 md:col-span-8">
            <p className="text-h2 font-bold uppercase">{t.feed.emptyTitle}</p>
            <p className="mt-4 max-w-md text-body">{t.feed.emptyBody}</p>
            <Link
              href="/welcome"
              data-welcome-link
              className="mt-4 inline-block border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
            >
              New here? Start here →
            </Link>
          </Window>
          <Window title={t.feed.howTitle} accent="blue" span="col-span-12 md:col-span-4">
            <p className="text-body">{t.feed.howBody}</p>
          </Window>
        </WindowGrid>
      ) : (
        // Masonry: one column on phones (everything stacks), 2–3 on wider
        // screens. CSS columns pack posts by natural height — no forced equal
        // rows, no blank gaps. (PostCard's grid col-span is inert here.)
        <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
          {items.map((it, i) => (
            <PostCard
              key={it.post.id}
              post={it.post}
              index={i}
              groups={groupTags.get(it.post.id) ?? []}
              fav={favs?.get(it.post.id)}
              cur={curs?.get(it.post.id)}
              canCurate={viewerIsCurator}
              curatedBy={it.curatedBy}
              following={following}
              canReportQuality={stamped}
              viewerId={viewerId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
