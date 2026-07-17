import type { Post } from "@atelier/core/posts/types";
import { PostThumb } from "@/components/posts/PostThumb";
import { StarRating } from "@/components/profile/StarRating";

function StaticStars({ value }: { value: number }) {
  if (!value) return <span className="text-caption uppercase opacity-40">Unrated</span>;
  return (
    <span data-stars={value} aria-label={`${value} of 5`} className="text-body leading-none text-blue">
      {"★".repeat(value)}
      <span className="opacity-30">{"☆".repeat(5 - value)}</span>
    </span>
  );
}

/**
 * A member's favorited works with their star ratings. On their own profile the
 * stars are editable; on someone else's they're read-only (public taste).
 */
export function FavoritesGallery({
  posts,
  ratings,
  editable,
}: {
  posts: Post[];
  ratings: Map<string, number>;
  editable: boolean;
}) {
  if (posts.length === 0) {
    return <p className="text-body opacity-70">No favorites yet.</p>;
  }
  return (
    <ul data-favorites className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {posts.map((p) => (
        <li key={p.id} data-fav={p.id} className="flex flex-col gap-2">
          <PostThumb post={p} />
          <span className="truncate text-caption font-bold uppercase" title={p.caption}>
            {p.caption || p.author_name}
          </span>
          {editable ? (
            <StarRating postId={p.id} initial={ratings.get(p.id) ?? 0} />
          ) : (
            <StaticStars value={ratings.get(p.id) ?? 0} />
          )}
        </li>
      ))}
    </ul>
  );
}
