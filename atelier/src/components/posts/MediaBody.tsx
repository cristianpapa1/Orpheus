import { ResponsiveImage } from "@/components/posts/ResponsiveImage";
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
  if (post.media_type === "video" && post.media_url) {
    return (
      <span data-media="video" className="relative block">
        <video
          controls
          playsInline
          preload="none"
          poster={post.variants.at(-1)?.url ?? post.image_url}
          className={`h-auto w-full ${className ?? ""}`}
        >
          <source src={post.media_url} />
          Your browser can&apos;t play this video.{" "}
        </video>
        <span
          data-duration
          className="pointer-events-none absolute right-2 top-2 border-2 border-ink bg-paper px-2 py-0.5 text-caption font-bold"
        >
          ▶ {formatDuration(post.duration_seconds)}
        </span>
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
        <audio controls preload="none" className="mt-2 w-full">
          <source src={post.media_url} />
        </audio>
      </span>
    );
  }

  return (
    <ResponsiveImage post={post} eager={eager} sizes={sizes} className={className} />
  );
}
