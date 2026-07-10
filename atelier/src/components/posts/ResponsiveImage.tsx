import type { Post } from "@atelier/core/posts/types";

/**
 * Responsive post image: srcset over the display variants, blur-up
 * placeholder behind, lazy by default (eager + high priority on detail).
 * Plain <img> by design — the variant set IS the optimization layer.
 */
export function ResponsiveImage({
  post,
  eager = false,
  sizes = "(max-width: 768px) 100vw, 60vw",
  className,
}: {
  post: Post;
  eager?: boolean;
  sizes?: string;
  className?: string;
}) {
  const largest = post.variants.at(-1);
  const src = largest?.url ?? post.image_url;
  const srcSet =
    post.variants.length > 1
      ? post.variants.map((v) => `${v.url} ${v.width}w`).join(", ")
      : undefined;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={post.alt_text || post.caption || `Work by ${post.author_name}`}
      width={post.image_width ?? undefined}
      height={post.image_height ?? undefined}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : undefined}
      className={`h-auto w-full ${className ?? ""}`}
      style={
        post.blur_data
          ? {
              backgroundImage: `url(${post.blur_data})`,
              backgroundSize: "cover",
            }
          : undefined
      }
    />
  );
}
