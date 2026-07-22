import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { Avatar } from "@/components/profile/Avatar";
import { GalleryPostDelete } from "@/components/profile/GalleryPostDelete";
import { FavoritesGallery } from "@/components/profile/FavoritesGallery";
import { getI18n } from "@/lib/i18n/server";
import { GRID_COLS, type LayoutBlock } from "@atelier/core/profile/layout";
import {
  CONTACT_KIND_LABEL,
  INSTITUTION_KIND_LABEL,
  contactHref,
  type PublicProfile,
} from "@atelier/core/profile/types";
import { thumbUrl, type Post } from "@atelier/core/posts/types";
import { formatEventDate, splitEvents, type EventItem } from "@atelier/core/events/types";
import {
  DISCIPLINE_LABEL,
  WORK_MODE_LABEL,
  type JobPost,
} from "@atelier/core/jobs/types";

const ROW_H = 56;
const ACCENTS = ["red", "blue", "yellow"] as const;

/**
 * Server-rendered read-only renderer for a user-built profile layout.
 * The same Window primitive as the rest of the facade — the profile IS
 * the facade, arranged by its owner.
 */
export async function ProfileCanvas({
  profile,
  posts = [],
  events = [],
  jobs = [],
  liked = [],
  likedRatings = new Map<string, number>(),
  now = "1970-01-01T00:00:00Z",
  ownerView = false,
}: {
  profile: PublicProfile;
  posts?: Post[];
  events?: EventItem[];
  jobs?: JobPost[];
  /** Posts the owner has favorited — shown in the "Liked" window. */
  liked?: Post[];
  /** The owner's star ratings for their liked posts, keyed by post id. */
  likedRatings?: Map<string, number>;
  now?: string;
  /** The viewer is the profile's owner — surface author-only controls (delete). */
  ownerView?: boolean;
}) {
  // Honor the owner's COLUMN arrangement (x, w) and their top-to-bottom
  // ORDER (y, then x), but let each window's HEIGHT follow its published
  // content — the designed `h` is only a minimum. This stops galleries and
  // long bios from being clipped while keeping the arranged facade.
  const ordered = [...profile.layout.blocks].sort(
    (a, b) => a.y - b.y || a.x - b.x,
  );
  const { t } = await getI18n();

  return (
    <div
      data-profile-canvas
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
        gridAutoRows: "minmax(0, auto)",
        gridAutoFlow: "row dense",
        alignItems: "start",
        gap: 8,
      }}
    >
      {ordered.map((block, i) => (
        <div
          key={block.id}
          data-profile-block={block.type}
          style={{
            gridColumn: `${block.x + 1} / span ${block.w}`,
            minHeight: block.h * ROW_H,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Window
            title={blockTitle(block)}
            accent={block.type === "bio" ? profile.accent : ACCENTS[i % ACCENTS.length]}
            className="h-full"
          >
            <BlockBody
              block={block}
              profile={profile}
              posts={posts}
              events={events}
              jobs={jobs}
              liked={liked}
              likedRatings={likedRatings}
              now={now}
              ownerView={ownerView}
              likedEmptyOwner={t.profile.likedEmptyOwner}
              likedEmptyOther={t.profile.likedEmptyOther}
            />
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
      return "Contact";
    case "gallery":
      return "Gallery";
    case "liked":
      return "Liked";
    case "posts":
      return "Posts";
    case "events":
      return "Events";
    case "jobs":
      return "Jobs";
  }
}

function BlockBody({
  block,
  profile,
  posts,
  events,
  jobs,
  liked,
  likedRatings,
  now,
  ownerView,
  likedEmptyOwner,
  likedEmptyOther,
}: {
  block: LayoutBlock;
  profile: PublicProfile;
  posts: Post[];
  events: EventItem[];
  jobs: JobPost[];
  liked: Post[];
  likedRatings: Map<string, number>;
  now: string;
  ownerView: boolean;
  likedEmptyOwner: string;
  likedEmptyOther: string;
}) {
  switch (block.type) {
    case "bio":
      return (
        <div>
          <div className="flex items-center gap-3">
            <Avatar url={profile.avatar_url} name={profile.display_name} size="md" />
            <div className="min-w-0">
              <p className="text-h2 font-bold uppercase break-words">{profile.display_name}</p>
              <p className="mt-1 text-caption font-bold uppercase break-words">
                @{profile.handle}
              </p>
            </div>
          </div>
          {profile.account_type === "institution" && profile.institution_kind ? (
            <p
              data-institution-badge={profile.institution_kind}
              className="mt-2 inline-block border-2 border-ink bg-ink px-2 py-0.5 text-caption font-bold uppercase text-paper"
            >
              {INSTITUTION_KIND_LABEL[profile.institution_kind]}
            </p>
          ) : null}
          {profile.bio ? <p className="mt-3 text-body">{profile.bio}</p> : null}
        </div>
      );
    case "links":
      return profile.contacts.length ? (
        <ul data-contact-list className="flex flex-col gap-2">
          {profile.contacts.map((c, i) => (
            <li key={i}>
              <a
                href={contactHref(c)}
                target={c.kind === "link" ? "_blank" : undefined}
                rel="noopener noreferrer"
                data-contact-kind={c.kind}
                className="group block"
              >
                <span className="text-caption font-bold uppercase opacity-60">
                  {CONTACT_KIND_LABEL[c.kind]}
                </span>
                <span className="block border-b-2 border-ink text-body font-bold group-hover:border-blue group-hover:text-blue">
                  {c.label}
                  {c.kind === "link" ? " ↗" : ""}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body opacity-70">No contact info yet.</p>
      );
    case "gallery":
      return posts.length ? (
        <div className="grid h-full grid-cols-3 content-start gap-2">
          {posts.slice(0, 6).map((post) => (
            <div key={post.id} className="relative">
              {post.media_type === "text" ? (
                <Link
                  href={`/p/${post.id}`}
                  data-gallery-post={post.id}
                  className="block border-2 border-ink hover:border-blue"
                >
                  <span className="flex aspect-square flex-col gap-1 overflow-hidden bg-ink/5 p-2">
                    {post.caption ? (
                      <span className="text-caption font-bold uppercase">
                        {post.caption}
                      </span>
                    ) : null}
                    {post.body ? (
                      <span className="line-clamp-6 whitespace-pre-wrap break-words text-caption leading-snug opacity-80">
                        {post.body}
                      </span>
                    ) : null}
                  </span>
                </Link>
              ) : (
                <Link
                  href={`/p/${post.id}`}
                  data-gallery-post={post.id}
                  className="block border-2 border-ink hover:border-blue"
                >
                  <span className="relative block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl(post)}
                      alt={post.alt_text || post.caption || `Work by ${profile.display_name}`}
                      loading="lazy"
                      decoding="async"
                      className="aspect-square h-auto w-full object-cover"
                    />
                    {post.media_type !== "image" ? (
                      <span
                        data-media-badge={post.media_type}
                        className="absolute left-1 top-1 border-2 border-ink bg-paper px-1 text-caption font-bold"
                        aria-label={post.media_type}
                      >
                        {post.media_type === "video" ? "▶" : "♪"}
                      </span>
                    ) : null}
                  </span>
                </Link>
              )}
              {ownerView ? <GalleryPostDelete postId={post.id} /> : null}
            </div>
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
    case "liked":
      return liked.length ? (
        <FavoritesGallery posts={liked} ratings={likedRatings} editable={ownerView} />
      ) : (
        <p className="text-body opacity-70">
          {ownerView ? likedEmptyOwner : likedEmptyOther}
        </p>
      );
    case "posts":
      return posts.length ? (
        <ul className="flex flex-col gap-2">
          {posts.slice(0, 4).map((post) => (
            <li key={post.id} className="relative flex items-center gap-2 pr-8">
              <Link
                href={`/p/${post.id}`}
                className="border-b-2 border-ink text-body font-bold hover:border-blue hover:text-blue"
              >
                {post.caption.slice(0, 60) ||
                  post.body?.slice(0, 60) ||
                  "Untitled work"}
              </Link>
              {ownerView ? <GalleryPostDelete postId={post.id} /> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body opacity-70">No posts yet.</p>
      );
    case "jobs": {
      const open = jobs.filter((j) => j.status === "open");
      const past = jobs.filter((j) => j.status !== "open");
      if (open.length === 0 && past.length === 0) {
        return <p className="text-body opacity-70">No open positions.</p>;
      }
      return (
        <div className="flex h-full flex-col overflow-auto">
          <ul className="flex flex-col gap-3">
            {open.map((job) => (
              <li key={job.id} data-profile-job={job.id} className="border-2 border-ink p-3">
                <p className="text-body font-bold">{job.title}</p>
                <p className="mt-1 text-caption font-bold uppercase">
                  {DISCIPLINE_LABEL[job.discipline]} ·{" "}
                  {WORK_MODE_LABEL[job.work_mode]}
                  {job.location ? ` · ${job.location}` : ""} · {job.compensation}
                </p>
              </li>
            ))}
            {open.length === 0 ? (
              <li className="text-body opacity-70">Nothing open right now.</li>
            ) : null}
          </ul>
          {past.length > 0 ? (
            <details data-past-jobs className="mt-3">
              <summary className="cursor-pointer text-caption font-bold uppercase">
                Filled & closed ({past.length})
              </summary>
              <ul className="mt-2 flex flex-col gap-1 opacity-70">
                {past.map((job) => (
                  <li key={job.id} className="text-caption uppercase">
                    {job.title} — {job.status}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          <Link
            href="/jobs"
            className="mt-3 self-start border-b-2 border-ink text-caption font-bold uppercase hover:text-blue"
          >
            Browse all jobs →
          </Link>
        </div>
      );
    }
    case "events": {
      const { upcoming, past } = splitEvents(events, now);
      if (upcoming.length === 0 && past.length === 0) {
        return <p className="text-body opacity-70">No events announced.</p>;
      }
      return (
        <div className="flex h-full flex-col overflow-auto">
          <ul className="flex flex-col gap-3">
            {upcoming.map((e) => (
              <li key={e.id} data-event={e.id} className="border-2 border-ink p-3">
                <p className="text-body font-bold">{e.title}</p>
                <p className="mt-1 text-caption font-bold uppercase">
                  {formatEventDate(e.starts_at)} ·{" "}
                  {e.location_type === "online" ? "Online" : e.location}
                </p>
                {e.description ? (
                  <p className="mt-1 text-body">{e.description}</p>
                ) : null}
                {e.ticket_url ? (
                  <a
                    data-ticket-link
                    href={e.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-red hover:border-red"
                  >
                    Tickets ↗
                  </a>
                ) : null}
              </li>
            ))}
            {upcoming.length === 0 ? (
              <li className="text-body opacity-70">Nothing upcoming right now.</li>
            ) : null}
          </ul>
          <Link
            href="/events"
            className="mt-3 self-start border-b-2 border-ink text-caption font-bold uppercase hover:text-blue"
          >
            All events →
          </Link>
          {past.length > 0 ? (
            <details data-past-events className="mt-4">
              <summary className="cursor-pointer text-caption font-bold uppercase">
                Past events ({past.length})
              </summary>
              <ul className="mt-2 flex flex-col gap-1 opacity-70">
                {past.map((e) => (
                  <li key={e.id} className="flex justify-between gap-2 text-caption uppercase">
                    <span>{e.title}</span>
                    <span>{formatEventDate(e.starts_at)}</span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      );
    }
  }
}
