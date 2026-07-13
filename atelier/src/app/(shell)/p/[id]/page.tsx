import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaBody } from "@/components/posts/MediaBody";
import { TextBody } from "@/components/posts/TextBody";
import { FavoritePost } from "@/components/posts/FavoritePost";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getPostById, getPostMentions } from "@/lib/posts/queries";
import { getFavoritesForPosts } from "@/lib/favorites/queries";
import { getFollowingRanked, getViewerId } from "@/lib/profile/queries";
import { getComments } from "@/lib/comments/queries";
import { isViewerAdmin } from "@/lib/donations/queries";
import { addComment, deleteComment } from "../../post/comments";
import {
  CATEGORY_LABEL,
  formatPostDate,
  subcategoryLabel,
} from "@atelier/core/posts/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return { title: "Not found — Atelier" };
  return {
    title: `${post.author_name}: ${post.caption.slice(0, 60) || CATEGORY_LABEL[post.category]} — Atelier`,
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();
  const [mentions, favs, following, comments, viewerId, isAdmin] =
    await Promise.all([
      getPostMentions(post.id),
      getFavoritesForPosts([post.id]),
      getFollowingRanked(),
      getComments(post.id),
      getViewerId(),
      isViewerAdmin(),
    ]);
  const configured = isSupabaseConfigured();

  return (
    <WindowGrid>
      <div data-post={post.id} className="col-span-12 flex flex-col md:col-span-8">
        <Window title={CATEGORY_LABEL[post.category]} accent="red" className="h-full">
          <FavoritePost postId={post.id} caption={post.caption} fav={favs?.get(post.id)} following={following}>
          {post.media_type === "text" ? (
            <>
              {post.caption ? (
                <h2 className="mb-4 text-h1 font-bold uppercase">{post.caption}</h2>
              ) : null}
              <TextBody body={post.body ?? ""} full />
            </>
          ) : (
            <>
              <MediaBody
                post={post}
                eager
                sizes="(max-width: 768px) 100vw, 66vw"
                className="border-2 border-ink"
              />
              {post.original_url ? (
                <a
                  data-full-resolution
                  href={post.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow"
                >
                  View full resolution ↗
                </a>
              ) : null}
            </>
          )}
          </FavoritePost>
        </Window>
      </div>
      <div className="col-span-12 flex flex-col md:col-span-4">
        <Window title="About this work" accent="blue" className="h-full">
          <Link
            href={`/u/${post.author_handle || post.author_id}`}
            className="text-h2 font-bold uppercase hover:text-blue"
          >
            {post.author_name}
          </Link>
          {post.author_handle ? (
            <p className="mt-1 text-caption font-bold uppercase">
              @{post.author_handle}
            </p>
          ) : null}
          {post.media_type !== "text" ? (
            <p className="mt-4 text-body">{post.caption || "Untitled work."}</p>
          ) : null}
          {post.tags.length > 0 ? (
            <p data-post-tags className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <Link
                  key={t}
                  href={`/t/${t}`}
                  className="text-caption font-bold uppercase text-blue hover:underline"
                >
                  #{t}
                </Link>
              ))}
            </p>
          ) : null}
          {mentions.length > 0 ? (
            <p data-post-mentions className="mt-3 flex flex-wrap items-baseline gap-2 text-caption uppercase">
              <span className="font-bold opacity-70">With</span>
              {mentions.map((m) => (
                <Link
                  key={m.id}
                  href={`/u/${m.handle || m.id}`}
                  data-mention={m.id}
                  className="border-b-2 border-ink font-bold hover:text-blue"
                >
                  @{m.handle || m.display_name}
                </Link>
              ))}
            </p>
          ) : null}
          <dl className="mt-6 flex flex-col gap-1 text-caption uppercase">
            <div className="flex justify-between border-t-2 border-ink pt-2">
              <dt className="font-bold">Category</dt>
              <dd>{CATEGORY_LABEL[post.category]}</dd>
            </div>
            {post.subcategory ? (
              <div className="flex justify-between border-t-2 border-ink pt-2">
                <dt className="font-bold">Style</dt>
                <dd>{subcategoryLabel(post.subcategory)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t-2 border-ink pt-2">
              <dt className="font-bold">Published</dt>
              <dd>
                <time dateTime={post.created_at}>
                  {formatPostDate(post.created_at)}
                </time>
              </dd>
            </div>
          </dl>
        </Window>
      </div>

      <div className="col-span-12 flex flex-col">
        <Window title={`Conversation (${comments.length})`} accent="blue" className="h-full">
          {comments.length === 0 ? (
            <p className="text-body opacity-70">No comments yet.</p>
          ) : (
            <ul data-comments className="flex flex-col gap-3">
              {comments.map((c) => (
                <li key={c.id} data-comment={c.id} className="border-2 border-ink p-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/u/${c.author_handle || c.author_id}`}
                      className="text-caption font-bold uppercase hover:text-blue"
                    >
                      {c.author_name}
                      {c.author_handle ? ` · @${c.author_handle}` : ""}
                    </Link>
                    <span className="shrink-0 text-caption uppercase opacity-70">
                      {c.created_at.slice(0, 10)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-body">
                    {c.body}
                  </p>
                  {viewerId === c.author_id || isAdmin ? (
                    <form action={deleteComment} className="mt-2">
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="post_id" value={post.id} />
                      <button
                        data-delete-comment
                        className="border-2 border-ink px-2 py-0.5 text-caption font-bold uppercase hover:bg-red hover:border-red hover:text-paper"
                      >
                        Delete
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {configured ? (
            viewerId ? (
              <form action={addComment} className="mt-4 flex flex-col gap-2">
                <input type="hidden" name="post_id" value={post.id} />
                <label htmlFor="comment-body" className="text-caption font-bold uppercase">
                  Add a comment
                </label>
                <textarea
                  id="comment-body"
                  name="body"
                  rows={3}
                  maxLength={2000}
                  required
                  placeholder="Say something…"
                  className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
                />
                <button className="self-start border-2 border-ink bg-ink px-4 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
                  Post comment
                </button>
              </form>
            ) : (
              <p className="mt-4 text-caption font-bold uppercase">
                <Link href="/login" className="border-b-2 border-ink hover:text-blue">
                  Sign in
                </Link>{" "}
                to join the conversation.
              </p>
            )
          ) : null}
        </Window>
      </div>
    </WindowGrid>
  );
}
