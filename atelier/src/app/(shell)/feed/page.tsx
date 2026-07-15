import Link from "next/link";
import { PostCard } from "@/components/posts/PostCard";
import { BauhausReveal } from "@/components/BauhausReveal";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getFeedPosts } from "@/lib/posts/queries";
import { getGroupsForPosts } from "@/lib/groups/queries";
import { getFavoritesForPosts } from "@/lib/favorites/queries";
import { getFollowingRanked, isViewerQualityStamped, getViewerId } from "@/lib/profile/queries";

export default async function FeedPage() {
  const posts = await getFeedPosts();
  const [groupTags, favs, following, stamped, viewerId] = await Promise.all([
    getGroupsForPosts(posts.map((p) => p.id)),
    getFavoritesForPosts(posts.map((p) => p.id)),
    getFollowingRanked(),
    isViewerQualityStamped(),
    getViewerId(),
  ]);

  return (
    <div>
      <BauhausReveal />
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-h1 font-bold uppercase">Feed</h1>
        <Link
          href="/post/new"
          data-new-post
          className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-red hover:border-red"
        >
          + New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <WindowGrid>
          <Window title="Feed" accent="red" span="col-span-12 md:col-span-8">
            <p className="text-h2 font-bold uppercase">Nothing here yet.</p>
            <p className="mt-4 max-w-md text-body">
              Follow creators to fill your feed — their work appears here in
              the order it was made. Start by exploring a profile and hitting
              Follow.
            </p>
            <Link
              href="/welcome"
              data-welcome-link
              className="mt-4 inline-block border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
            >
              New here? Start here →
            </Link>
          </Window>
          <Window title="How it works" accent="blue" span="col-span-12 md:col-span-4">
            <p className="text-body">
              No algorithmic ranking. No ads. Nothing pays for reach. What you
              follow is what you see.
            </p>
          </Window>
        </WindowGrid>
      ) : (
        // Masonry: one column on phones (everything stacks), 2–3 on wider
        // screens. CSS columns pack posts by natural height — no forced equal
        // rows, no blank gaps. (PostCard's grid col-span is inert here.)
        <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              index={i}
              groups={groupTags.get(post.id) ?? []}
              fav={favs?.get(post.id)}
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
