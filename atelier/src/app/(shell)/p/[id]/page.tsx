import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaBody } from "@/components/posts/MediaBody";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getPostById, getPostMentions } from "@/lib/posts/queries";
import {
  CATEGORY_LABEL,
  formatPostDate,
  subcategoryLabel,
} from "@atelier/core/posts/types";
import { ReportControl } from "@/components/moderation/ReportControl";
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
  const mentions = await getPostMentions(post.id);

  return (
    <WindowGrid>
      <div data-post={post.id} className="col-span-12 flex flex-col md:col-span-8">
        <Window title={CATEGORY_LABEL[post.category]} accent="red" className="h-full">
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
          <p className="mt-4 text-body">{post.caption || "Untitled work."}</p>
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
          {isSupabaseConfigured() ? (
            <div className="mt-4">
              <ReportControl
                subjectType="post"
                subjectId={post.id}
                backTo={`/p/${post.id}`}
              />
            </div>
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
    </WindowGrid>
  );
}
