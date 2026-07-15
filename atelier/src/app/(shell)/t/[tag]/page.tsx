import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/posts/PostCard";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getPostsByTag } from "@/lib/posts/queries";
import { getFavoritesForPosts } from "@/lib/favorites/queries";
import { getGroupsForPosts } from "@/lib/groups/queries";
import { getFollowingRanked, isViewerQualityStamped, getViewerId } from "@/lib/profile/queries";
import { parsePostTags } from "@atelier/core/posts/types";

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${tag} — Atelier` };
}

export default async function TagPage({ params }: Props) {
  const { tag: raw } = await params;
  const tag = parsePostTags(raw)[0] ?? raw.toLowerCase();
  const posts = await getPostsByTag(tag);
  const [groupTags, favs, following, stamped, viewerId] = await Promise.all([
    getGroupsForPosts(posts.map((p) => p.id)),
    getFavoritesForPosts(posts.map((p) => p.id)),
    getFollowingRanked(),
    isViewerQualityStamped(),
    getViewerId(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold uppercase">#{tag}</h1>
      {posts.length === 0 ? (
        <WindowGrid>
          <Window title="No work yet" accent="red" span="col-span-12 md:col-span-8">
            <p className="text-body">
              Nothing tagged #{tag} yet.{" "}
              <Link href="/feed" className="border-b-2 border-ink font-bold hover:text-blue">
                Back to the feed
              </Link>
              .
            </p>
          </Window>
        </WindowGrid>
      ) : (
        <WindowGrid>
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
        </WindowGrid>
      )}
    </div>
  );
}
