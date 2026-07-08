import Link from "next/link";
import { PostCard } from "@/components/posts/PostCard";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getFeedPosts } from "@/lib/posts/queries";
import { getGroupsForPosts } from "@/lib/groups/queries";

export default async function FeedPage() {
  const posts = await getFeedPosts();
  const groupTags = await getGroupsForPosts(posts.map((p) => p.id));

  return (
    <div>
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
          </Window>
          <Window title="How it works" accent="blue" span="col-span-12 md:col-span-4">
            <p className="text-body">
              No algorithmic ranking. No ads. Nothing pays for reach. What you
              follow is what you see.
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
            />
          ))}
        </WindowGrid>
      )}
    </div>
  );
}
