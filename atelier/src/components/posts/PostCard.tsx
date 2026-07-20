import Link from "next/link";
import { Window, type WindowAccent } from "@/components/ui/Window";
import { MediaBody } from "@/components/posts/MediaBody";
import { ResponsiveImage } from "@/components/posts/ResponsiveImage";
import { PostCarousel } from "@/components/posts/PostCarousel";
import { TextBody } from "@/components/posts/TextBody";
import {
  aspectClass,
  frameClasses,
  spanClass,
} from "@atelier/core/posts/display";
import { formatPostDate, type Post } from "@atelier/core/posts/types";
import { localizedCategoryLabel } from "@atelier/core/taxonomy/i18n";
import type { GroupTag } from "@/lib/groups/types";
import { FavoritePost, type Contact } from "@/components/posts/FavoritePost";
import { Avatar } from "@/components/profile/Avatar";
import type { FavInfo } from "@/lib/favorites/queries";
import type { CurationInfo } from "@/lib/curations/queries";
import type { FeedCurator } from "@/lib/posts/queries";
import { getI18n } from "@/lib/i18n/server";

const ACCENTS: WindowAccent[] = ["red", "blue", "yellow"];

/**
 * A post as a window in the feed facade. How it displays — span, frame,
 * aspect — is the owner's choice, carried in post.display (Phase 3).
 * Group tags render as "also in [group]" markers (Phase 4 cross-linking).
 */
export async function PostCard({
  post,
  index = 0,
  groups = [],
  fav,
  cur,
  canCurate = false,
  curatedBy = null,
  following = [],
  canReportQuality = false,
  viewerId = null,
}: {
  post: Post;
  index?: number;
  groups?: GroupTag[];
  fav?: FavInfo;
  cur?: CurationInfo;
  canCurate?: boolean;
  /** When set, this card is in the feed because a curator you follow reposted it. */
  curatedBy?: FeedCurator | null;
  following?: Contact[];
  canReportQuality?: boolean;
  viewerId?: string | null;
}) {
  const { t, locale } = await getI18n();
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
        title={localizedCategoryLabel(post.category, locale)}
        accent={ACCENTS[index % ACCENTS.length]}
        flush
        className="h-full"
      >
        {curatedBy ? (
          <Link
            href={`/u/${curatedBy.handle || curatedBy.id}`}
            data-curated-by={curatedBy.id}
            className="flex items-center gap-2 border-b-2 border-ink bg-blue px-4 py-1.5 text-caption font-bold uppercase text-paper hover:bg-ink"
          >
            <span aria-hidden>♺</span>
            Curated by {curatedBy.display_name}
            {curatedBy.handle ? ` · @${curatedBy.handle}` : ""}
          </Link>
        ) : null}
        {post.media_type === "text" ? (
          <Link href={`/p/${post.id}`} className="block p-4">
            {post.caption ? (
              <p className="mb-2 text-h2 font-bold uppercase">{post.caption}</p>
            ) : null}
            <TextBody body={post.body ?? ""} />
          </Link>
        ) : post.media_type === "image" && post.images.length > 1 ? (
          <div className={frame.wrapper}>
            <PostCarousel
              images={post.images}
              alt={post.alt_text ?? post.caption}
              className={`${frame.image} ${aspectClass(post.display.aspect)}`}
            />
          </div>
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
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/u/${post.author_handle || post.author_id}`}
              className="flex min-w-0 items-center gap-2 text-caption font-bold uppercase hover:text-blue"
            >
              <Avatar
                url={post.author_avatar_url}
                name={post.author_name}
                size="sm"
              />
              <span className="truncate">
                {post.author_name}
                {post.author_handle ? ` · @${post.author_handle}` : ""}
              </span>
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
                  {t.post.alsoIn} {g.name}
                </Link>
              ))}
            </p>
          ) : null}
          <FavoritePost
            postId={post.id}
            caption={post.caption}
            fav={fav}
            cur={cur}
            canCurate={canCurate}
            curatedHref={`/p/${post.id}`}
            following={following}
            canReportQuality={canReportQuality}
            canDelete={!!viewerId && viewerId === post.author_id}
            checkoutUrl={post.checkout_url}
          />
        </div>
      </Window>
    </div>
  );
}
