import Link from "next/link";
import { Avatar } from "@/components/profile/Avatar";
import { formatPostDate } from "@atelier/core/posts/types";
import { postGroupMessage } from "@/app/(shell)/groups/discussion-actions";
import type { GroupThreadSummary, DiscussionAccess } from "@/lib/groups/discussion";

const FIELD =
  "w-full border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue";

/** One row per discussion, linking to its own page. */
function ThreadCard({ t, slug }: { t: GroupThreadSummary; slug: string }) {
  const heading = t.title?.trim() || t.body.split("\n")[0].slice(0, 90) || "Untitled";
  const snippet = t.title ? t.body.replace(/\s+/g, " ").slice(0, 140) : "";
  return (
    <li data-group-thread={t.id} className="border-2 border-ink">
      <Link
        href={`/g/${slug}/t/${t.id}`}
        className="group flex flex-col gap-2 p-3 hover:bg-yellow/40"
      >
        <span className="text-body font-bold uppercase group-hover:text-blue">
          {heading}
        </span>
        {snippet ? (
          <span className="line-clamp-2 text-caption opacity-70">{snippet}</span>
        ) : null}
        <span className="flex flex-wrap items-center gap-2 text-caption uppercase opacity-70">
          <Avatar url={t.author_avatar_url} name={t.author_name} size="sm" />
          <span className="font-bold">{t.author_name}</span>
          <span aria-hidden>·</span>
          <span>
            {t.reply_count} {t.reply_count === 1 ? "reply" : "replies"}
          </span>
          <span aria-hidden>·</span>
          <time>{formatPostDate(t.last_activity)}</time>
        </span>
      </Link>
    </li>
  );
}

export function GroupThreadList({
  threads,
  access,
  groupId,
  slug,
}: {
  threads: GroupThreadSummary[];
  access: DiscussionAccess;
  groupId: string;
  slug: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-caption font-bold uppercase opacity-70">{access.label}</p>

      {access.canPostTop ? (
        <form action={postGroupMessage} className="flex flex-col gap-2">
          <input type="hidden" name="group_id" value={groupId} />
          <input type="hidden" name="slug" value={slug} />
          <input
            name="title"
            maxLength={140}
            data-discussion-title
            placeholder="Discussion title (optional)"
            className={`${FIELD} font-bold`}
          />
          <textarea
            name="body"
            required
            rows={3}
            maxLength={4000}
            data-discussion-compose
            placeholder="Start a discussion… @mention people, paste a post or Astelier link"
            className={FIELD}
          />
          <button className="self-start border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
            Start discussion
          </button>
        </form>
      ) : (
        <p className="border-2 border-dashed border-ink/40 px-3 py-2 text-caption font-bold uppercase opacity-70">
          {access.canReply
            ? "Only owners start discussions here — open one to reply."
            : "Only owners post here."}
        </p>
      )}

      {threads.length === 0 ? (
        <p className="text-body opacity-70">No discussions yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {threads.map((t) => (
            <ThreadCard key={t.id} t={t} slug={slug} />
          ))}
        </ul>
      )}
    </div>
  );
}
