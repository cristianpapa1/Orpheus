import { ResponsiveImage } from "@/components/posts/ResponsiveImage";
import { PostCarousel } from "@/components/posts/PostCarousel";
import { TextBody } from "@/components/posts/TextBody";
import { MediaPlayer } from "@/components/posts/MediaPlayer";
import { formatDuration, type Post } from "@atelier/core/posts/types";

/**
 * Renders a post's media by type. AV rule of the house: NEVER autoplay —
 * poster + explicit controls, sound only on the user's action.
 */
export function MediaBody({
  post,
  eager = false,
  sizes,
  className,
}: {
  post: Post;
  eager?: boolean;
  sizes?: string;
  className?: string;
}) {
  if (post.media_type === "text") {
    return (
      <span data-media="text" className="block">
        <TextBody body={post.body ?? ""} className={className} />
        {post.media_url ? (
          // A poem with its reading — the audio rides along on the text post.
          <MediaPlayer
            kind="audio"
            src={post.media_url}
            durationSeconds={post.duration_seconds}
          />
        ) : null}
      </span>
    );
  }

  if (post.media_type === "video" && post.media_url) {
    return (
      <span data-media="video" className="block">
        <MediaPlayer
          kind="video"
          src={post.media_url}
          poster={post.variants.at(-1)?.url ?? post.image_url}
          durationSeconds={post.duration_seconds}
          className={className}
        />
      </span>
    );
  }

  if (post.media_type === "audio" && post.media_url) {
    return (
      <span data-media="audio" className="block">
        <span className="relative block">
          <ResponsiveImage
            post={post}
            eager={eager}
            sizes={sizes}
            className={className}
          />
          <span
            data-duration
            className="pointer-events-none absolute right-2 top-2 border-2 border-ink bg-paper px-2 py-0.5 text-caption font-bold"
          >
            ♪ {formatDuration(post.duration_seconds)}
          </span>
        </span>
        <MediaPlayer
          kind="audio"
          src={post.media_url}
          durationSeconds={post.duration_seconds}
        />
      </span>
    );
  }

  if (post.images.length > 1) {
    return (
      <PostCarousel
        images={post.images}
        alt={post.alt_text ?? post.caption}
        eager={eager}
        className={className}
      />
    );
  }

  return (
    <ResponsiveImage post={post} eager={eager} sizes={sizes} className={className} />
  );
}
