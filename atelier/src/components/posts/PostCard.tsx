import Link from "next/link";
import { Window, type WindowAccent } from "@/components/ui/Window";
import { CATEGORY_LABEL, formatPostDate, type Post } from "@/lib/posts/types";

const ACCENTS: WindowAccent[] = ["red", "blue", "yellow"];

/** A post as a window in the feed facade. */
export function PostCard({
  post,
  index = 0,
  span = "col-span-12 md:col-span-6",
}: {
  post: Post;
  index?: number;
  span?: string;
}) {
  return (
    <div data-post={post.id} className={`flex flex-col ${span}`}>
      <Window title={CATEGORY_LABEL[post.category]} accent={ACCENTS[index % ACCENTS.length]} className="h-full">
        <Link href={`/p/${post.id}`} className="block border-2 border-ink">
          {/* Plain <img>: the media pipeline (responsive sizes, blur-up) is Phase 3 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt={post.caption || `Work by ${post.author_name}`}
            width={post.image_width ?? undefined}
            height={post.image_height ?? undefined}
            loading="lazy"
            className="h-auto w-full"
          />
        </Link>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <Link
            href={`/u/${post.author_handle}`}
            className="text-caption font-bold uppercase hover:text-blue"
          >
            {post.author_name} · @{post.author_handle}
          </Link>
          <time
            dateTime={post.created_at}
            className="shrink-0 text-caption uppercase opacity-70"
          >
            {formatPostDate(post.created_at)}
          </time>
        </div>
        {post.caption ? <p className="mt-2 text-body">{post.caption}</p> : null}
      </Window>
    </div>
  );
}
