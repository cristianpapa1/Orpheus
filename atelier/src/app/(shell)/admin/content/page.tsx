import { notFound } from "next/navigation";
import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getRecentPosts } from "@/lib/posts/queries";
import { getGroups } from "@/lib/groups/queries";
import { isViewerAdmin } from "@/lib/donations/queries";
import {
  CATEGORY_LABEL,
  formatPostDate,
  thumbUrl,
} from "@atelier/core/posts/types";
import { removeGroup, removePost } from "./actions";

export const metadata = { title: "Content — Atelier admin" };

const ERRORS: Record<string, string> = {
  forbidden: "You're not an admin.",
  service: "Service role not configured.",
  post: "Couldn't remove that post.",
  group: "Couldn't remove that group.",
  unavailable: "Preview mode — needs Supabase configured.",
};

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ removed?: string; error?: string }>;
}) {
  if (!(await isViewerAdmin())) notFound();

  const { removed, error } = await searchParams;
  const [posts, groups] = await Promise.all([getRecentPosts(50), getGroups()]);

  return (
    <div>
      <h1 className="mb-2 text-h1 font-bold uppercase">Content</h1>
      <p className="mb-6 max-w-2xl text-body">
        Recent posts and every group. Removing is permanent and cascades
        (tags, mentions, memberships).
      </p>

      {removed ? (
        <p role="status" className="mb-4 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
          {removed === "group" ? "Group removed." : "Post removed."}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mb-4 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
          {ERRORS[error] ?? "Something went wrong."}
        </p>
      ) : null}

      <WindowGrid>
        <Window title={`Posts (${posts.length})`} accent="red" span="col-span-12">
          {posts.length === 0 ? (
            <p className="text-body opacity-70">No posts yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {posts.map((p) => (
                <li
                  key={p.id}
                  data-admin-post={p.id}
                  className="flex flex-wrap items-center gap-3 border-b-2 border-ink pb-3"
                >
                  <Link href={`/p/${p.id}`} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl(p)}
                      alt=""
                      className="size-12 border-2 border-ink object-cover"
                    />
                  </Link>
                  <div className="min-w-0 grow">
                    <p className="truncate text-body font-bold">
                      {p.caption || "Untitled work"}
                    </p>
                    <p className="text-caption uppercase opacity-70">
                      {CATEGORY_LABEL[p.category]} · by{" "}
                      <Link href={`/u/${p.author_handle || p.author_id}`} className="hover:text-blue">
                        {p.author_name}
                      </Link>{" "}
                      · {formatPostDate(p.created_at)}
                    </p>
                  </div>
                  <Link
                    href={`/p/${p.id}`}
                    target="_blank"
                    className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow"
                  >
                    View
                  </Link>
                  <form action={removePost}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      data-remove-post
                      className="border-2 border-red px-3 py-1 text-caption font-bold uppercase hover:bg-red hover:text-paper"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Window>

        <Window title={`Groups (${groups.length})`} accent="blue" span="col-span-12">
          {groups.length === 0 ? (
            <p className="text-body opacity-70">No groups yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {groups.map((g) => (
                <li
                  key={g.id}
                  data-admin-group={g.slug}
                  className="flex flex-wrap items-center gap-3 border-b-2 border-ink pb-3"
                >
                  <div className="min-w-0 grow">
                    <Link href={`/g/${g.slug}`} className="text-body font-bold hover:text-blue">
                      {g.name}
                    </Link>
                    <p className="text-caption uppercase opacity-70">
                      {g.member_count} members · {g.follower_count} followers
                      {g.is_private ? " · private" : ""}
                    </p>
                  </div>
                  <form action={removeGroup}>
                    <input type="hidden" name="id" value={g.id} />
                    <button
                      data-remove-group
                      className="border-2 border-red px-3 py-1 text-caption font-bold uppercase hover:bg-red hover:text-paper"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Window>
      </WindowGrid>
    </div>
  );
}
