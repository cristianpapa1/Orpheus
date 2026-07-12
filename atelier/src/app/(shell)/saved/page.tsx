import Link from "next/link";
import { PostCard } from "@/components/posts/PostCard";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getSavedPosts } from "@/lib/favorites/queries";
import { getFavoritesForPosts } from "@/lib/favorites/queries";
import { getGroupsForPosts } from "@/lib/groups/queries";
import { getMutualFollows } from "@/lib/profile/queries";

export const metadata = { title: "Saved — Atelier" };

export default async function SavedPage() {
  const posts = await getSavedPosts();
  const [groupTags, favs, mutuals] = await Promise.all([
    getGroupsForPosts(posts.map((p) => p.id)),
    getFavoritesForPosts(posts.map((p) => p.id)),
    getMutualFollows(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold uppercase">Saved</h1>
      {posts.length === 0 ? (
        <WindowGrid>
          <Window title="Nothing saved yet" accent="red" span="col-span-12 md:col-span-8">
            <p className="text-body">
              Favorite a work — the heart on any post, or a double-tap — and it
              collects here for you to come back to.
            </p>
            <Link
              href="/feed"
              className="mt-4 inline-block border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
            >
              Back to the feed →
            </Link>
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
              mutuals={mutuals}
            />
          ))}
        </WindowGrid>
      )}
    </div>
  );
}
