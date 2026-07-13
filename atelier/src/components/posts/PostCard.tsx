import Link from "next/link";
import { Window, type WindowAccent } from "@/components/ui/Window";
import { MediaBody } from "@/components/posts/MediaBody";
import { ResponsiveImage } from "@/components/posts/ResponsiveImage";
import { TextBody } from "@/components/posts/TextBody";
import {
  aspectClass,
  frameClasses,
  spanClass,
} from "@atelier/core/posts/display";
import { CATEGORY_LABEL, formatPostDate, type Post } from "@atelier/core/posts/types";
import type { GroupTag } from "@/lib/groups/types";
import { FavoritePost, type Contact } from "@/components/posts/FavoritePost";
import type { FavInfo } from "@/lib/favorites/queries";

const ACCENTS: WindowAccent[] = ["red", "blue", "yellow"];

/**
 * A post as a window in the feed facade. How it displays — span, frame,
 * aspect — is the owner's choice, carried in post.display (Phase 3).
 * Group tags render as "also in [group]" markers (Phase 4 cross-linking).
 */
export function PostCard({
  post,
  index = 0,
  groups = [],
  fav,
  following = [],
  canReportQuality = false,
}: {
  post: Post;
  index?: number;
  groups?: GroupTag[];
  fav?: FavInfo;
  following?: Contact[];
  canReportQuality?: boolean;
}) {
  const frame = frameClasses(post.display.frame);

  return (
    <div
      data-post={post.id}
      data-frame={post.display.frame}
      data-span={post.display.span}
      {...(post.display.school ? { "data-school": post.display.school } : {})}
      className={`flex flex-col ${spanClass(post.display.span)}`}
    >
      <Window
        title={CATEGORY_LABEL[post.category]}
        accent={ACCENTS[index % ACCENTS.length]}
        flush
        className="h-full"
      >
        {post.media_type === "text" ? (
          <Link href={`/p/${post.id}`} className="block p-4">
            {post.caption ? (
              <p className="mb-2 text-h2 font-bold uppercase">{post.caption}</p>
            ) : null}
            <TextBody body={post.body ?? ""} />
          </Link>
        ) : post.media_type === "image" ? (
          <Link href={`/p/${post.id}`} className={frame.wrapper}>
            <ResponsiveImage
              post={post}
              className={`${frame.image} ${aspectClass(post.display.aspect)}`}
            />
          </Link>
        ) : (
          <div className={frame.wrapper}>
            <MediaBody
              post={post}
              className={`${frame.image} ${aspectClass(post.display.aspect)}`}
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-baseline justify-between gap-3">
            <Link
              href={`/u/${post.author_handle || post.author_id}`}
              className="text-caption font-bold uppercase hover:text-blue"
            >
              {post.author_name}
              {post.author_handle ? ` · @${post.author_handle}` : ""}
            </Link>
            <time
              dateTime={post.created_at}
              className="shrink-0 text-caption uppercase opacity-70"
            >
              {formatPostDate(post.created_at)}
            </time>
          </div>
          {post.caption && post.media_type !== "text" ? (
            <p className="mt-2 text-body">{post.caption}</p>
          ) : null}
          {post.tags.length > 0 ? (
            <p className="mt-2 flex flex-wrap gap-1">
              {post.tags.map((t) => (
                <Link
                  key={t}
                  href={`/t/${t}`}
                  data-tag={t}
                  className="text-caption font-bold uppercase text-blue hover:underline"
                >
                  #{t}
                </Link>
              ))}
            </p>
          ) : null}
          {groups.length > 0 ? (
            <p className="mt-3 flex flex-wrap gap-2">
              {groups.map((g) => (
                <Link
                  key={g.slug}
                  href={`/g/${g.slug}`}
                  data-also-in={g.slug}
                  className="border-2 border-ink px-2 py-0.5 text-caption font-bold uppercase hover:bg-yellow"
                >
                  also in {g.name}
                </Link>
              ))}
            </p>
          ) : null}
          <FavoritePost
            postId={post.id}
            caption={post.caption}
            fav={fav}
            following={following}
            canReportQuality={canReportQuality}
          />
        </div>
      </Window>
    </div>
  );
}
