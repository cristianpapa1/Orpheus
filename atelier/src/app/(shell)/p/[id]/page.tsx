import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getPostById } from "@/lib/posts/queries";
import { CATEGORY_LABEL, formatPostDate } from "@/lib/posts/types";

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

  return (
    <WindowGrid>
      <div data-post={post.id} className="col-span-12 flex flex-col md:col-span-8">
        <Window title={CATEGORY_LABEL[post.category]} accent="red" className="h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt={post.caption || `Work by ${post.author_name}`}
            width={post.image_width ?? undefined}
            height={post.image_height ?? undefined}
            className="h-auto w-full border-2 border-ink"
          />
        </Window>
      </div>
      <div className="col-span-12 flex flex-col md:col-span-4">
        <Window title="About this work" accent="blue" className="h-full">
          <Link
            href={`/u/${post.author_handle}`}
            className="text-h2 font-bold uppercase hover:text-blue"
          >
            {post.author_name}
          </Link>
          <p className="mt-1 text-caption font-bold uppercase">
            @{post.author_handle}
          </p>
          <p className="mt-4 text-body">{post.caption || "Untitled work."}</p>
          <dl className="mt-6 flex flex-col gap-1 text-caption uppercase">
            <div className="flex justify-between border-t-2 border-ink pt-2">
              <dt className="font-bold">Category</dt>
              <dd>{CATEGORY_LABEL[post.category]}</dd>
            </div>
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
