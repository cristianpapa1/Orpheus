import Link from "next/link";
import type { Post } from "@atelier/core/posts/types";

/** A square thumbnail linking to a post — used in profile favorites/curated shelves. */
export function PostThumb({ post }: { post: Post }) {
  return (
    <Link href={`/p/${post.id}`} data-thumb={post.id} className="block border-2 border-ink bg-paper">
      {post.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image_url}
          alt={post.alt_text ?? post.caption ?? ""}
          loading="lazy"
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center p-3 text-center text-caption font-bold uppercase">
          {post.caption || post.category}
        </div>
      )}
    </Link>
  );
}
