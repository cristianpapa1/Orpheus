import { PostThumb } from "@/components/posts/PostThumb";
import type { CuratedPick } from "@/lib/curations/queries";

/** A curator's public picks — works they reposted as "curated", each with an
 *  optional Astelier buy link the curator attached. */
export function CuratedGallery({ picks }: { picks: CuratedPick[] }) {
  if (picks.length === 0) {
    return <p className="text-body opacity-70">No curated picks yet.</p>;
  }
  return (
    <ul data-curated-gallery className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {picks.map(({ post, storeUrl }) => (
        <li key={post.id} data-curated={post.id} className="flex flex-col gap-1">
          <PostThumb post={post} />
          <span className="border-2 border-blue bg-blue px-2 py-0.5 text-center text-caption font-bold uppercase text-paper">
            ♺ Curated
          </span>
          <span className="truncate text-caption font-bold uppercase" title={post.caption}>
            {post.caption || post.author_name}
          </span>
          {storeUrl ? (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-buy
              className="border-2 border-ink px-2 py-0.5 text-center text-caption font-bold uppercase hover:bg-yellow"
            >
              Buy at Astelier →
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
