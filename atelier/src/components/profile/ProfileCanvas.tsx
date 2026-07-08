import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { GRID_COLS, type LayoutBlock } from "@/lib/profile/layout";
import type { PublicProfile } from "@/lib/profile/types";
import type { Post } from "@/lib/posts/types";

const ROW_H = 56;
const ACCENTS = ["red", "blue", "yellow"] as const;

/**
 * Server-rendered read-only renderer for a user-built profile layout.
 * The same Window primitive as the rest of the facade — the profile IS
 * the facade, arranged by its owner.
 */
export function ProfileCanvas({
  profile,
  posts = [],
}: {
  profile: PublicProfile;
  posts?: Post[];
}) {
  return (
    <div
      data-profile-canvas
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
        gridAutoRows: ROW_H,
        gap: 8,
      }}
    >
      {profile.layout.blocks.map((block, i) => (
        <div
          key={block.id}
          data-profile-block={block.type}
          style={{
            gridColumn: `${block.x + 1} / span ${block.w}`,
            gridRow: `${block.y + 1} / span ${block.h}`,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <Window
            title={blockTitle(block)}
            accent={ACCENTS[i % ACCENTS.length]}
            className="h-full overflow-hidden"
          >
            <BlockBody block={block} profile={profile} posts={posts} />
          </Window>
        </div>
      ))}
    </div>
  );
}

function blockTitle(block: LayoutBlock): string {
  switch (block.type) {
    case "bio":
      return "Bio";
    case "links":
      return "Links";
    case "gallery":
      return "Gallery";
    case "posts":
      return "Posts";
    case "events":
      return "Events";
  }
}

function BlockBody({
  block,
  profile,
  posts,
}: {
  block: LayoutBlock;
  profile: PublicProfile;
  posts: Post[];
}) {
  switch (block.type) {
    case "bio":
      return (
        <div>
          <p className="text-h2 font-bold uppercase">{profile.display_name}</p>
          <p className="mt-1 text-caption font-bold uppercase">
            @{profile.handle}
          </p>
          {profile.bio ? <p className="mt-3 text-body">{profile.bio}</p> : null}
        </div>
      );
    case "links":
      return profile.links.length ? (
        <ul className="flex flex-col gap-2">
          {profile.links.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-b-2 border-ink text-body font-bold hover:border-blue hover:text-blue"
              >
                {link.label} ↗
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body opacity-70">No links yet.</p>
      );
    case "gallery":
      return posts.length ? (
        <div className="grid h-full grid-cols-3 content-start gap-2">
          {posts.slice(0, 6).map((post) => (
            <Link
              key={post.id}
              href={`/p/${post.id}`}
              data-gallery-post={post.id}
              className="block border-2 border-ink hover:border-blue"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image_url}
                alt={post.caption || `Work by ${profile.display_name}`}
                loading="lazy"
                className="aspect-square h-auto w-full object-cover"
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="grid grow grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-2 border-ink bg-ink/5" />
            ))}
          </div>
          <p className="mt-2 text-caption uppercase opacity-70">
            No work published yet
          </p>
        </div>
      );
    case "posts":
      return posts.length ? (
        <ul className="flex flex-col gap-2">
          {posts.slice(0, 4).map((post) => (
            <li key={post.id}>
              <Link
                href={`/p/${post.id}`}
                className="border-b-2 border-ink text-body font-bold hover:border-blue hover:text-blue"
              >
                {post.caption.slice(0, 60) || "Untitled work"}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body opacity-70">No posts yet.</p>
      );
    case "events":
      return (
        <p className="text-body opacity-70">
          Upcoming events with ticket links arrive in phase 6.
        </p>
      );
  }
}
