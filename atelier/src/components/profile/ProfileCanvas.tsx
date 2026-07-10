import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { GRID_COLS, type LayoutBlock } from "@/lib/profile/layout";
import type { PublicProfile } from "@/lib/profile/types";
import { thumbUrl, type Post } from "@/lib/posts/types";
import { formatEventDate, splitEvents, type EventItem } from "@/lib/events/types";
import {
  DISCIPLINE_LABEL,
  WORK_MODE_LABEL,
  type JobPost,
} from "@/lib/jobs/types";

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
  events = [],
  jobs = [],
  now = "1970-01-01T00:00:00Z",
}: {
  profile: PublicProfile;
  posts?: Post[];
  events?: EventItem[];
  jobs?: JobPost[];
  now?: string;
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
            <BlockBody
              block={block}
              profile={profile}
              posts={posts}
              events={events}
              jobs={jobs}
              now={now}
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
      return "Links";
    case "gallery":
      return "Gallery";
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
  now,
}: {
  block: LayoutBlock;
  profile: PublicProfile;
  posts: Post[];
  events: EventItem[];
  jobs: JobPost[];
  now: string;
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
                src={thumbUrl(post)}
                alt={post.caption || `Work by ${profile.display_name}`}
                loading="lazy"
                decoding="async"
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
