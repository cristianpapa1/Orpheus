import Link from "next/link";
import { Window, type WindowAccent } from "@/components/ui/Window";
import { ResponsiveImage } from "@/components/posts/ResponsiveImage";
import {
  aspectClass,
  frameClasses,
  spanClass,
} from "@/lib/posts/display";
import { CATEGORY_LABEL, formatPostDate, type Post } from "@/lib/posts/types";

const ACCENTS: WindowAccent[] = ["red", "blue", "yellow"];

/**
 * A post as a window in the feed facade. How it displays — span, frame,
 * aspect — is the owner's choice, carried in post.display (Phase 3).
 */
export function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  const frame = frameClasses(post.display.frame);

  return (
    <div
      data-post={post.id}
      data-frame={post.display.frame}
      data-span={post.display.span}
      className={`flex flex-col ${spanClass(post.display.span)}`}
    >
      <Window
        title={CATEGORY_LABEL[post.category]}
        accent={ACCENTS[index % ACCENTS.length]}
        flush
        className="h-full"
      >
        <Link href={`/p/${post.id}`} className={frame.wrapper}>
          <ResponsiveImage
            post={post}
            className={`${frame.image} ${aspectClass(post.display.aspect)}`}
          />
        </Link>
        <div className="p-4">
          <div className="flex items-baseline justify-between gap-3">
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
        </div>
      </Window>
    </div>
  );
}
