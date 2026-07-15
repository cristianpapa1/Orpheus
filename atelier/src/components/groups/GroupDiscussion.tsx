import { MessageBody } from "@/components/chat/MessageBody";
import { Avatar } from "@/components/profile/Avatar";
import { formatPostDate } from "@atelier/core/posts/types";
import {
  postGroupMessage,
  deleteGroupMessage,
} from "@/app/(shell)/groups/discussion-actions";
import type {
  GroupMessage,
  GroupThread,
  DiscussionAccess,
} from "@/lib/groups/discussion";

const FIELD =
  "w-full border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue";

function MessageRow({
  msg,
  slug,
  canDelete,
}: {
  msg: GroupMessage;
  slug: string;
  canDelete: boolean;
}) {
  return (
    <div data-group-message={msg.id} className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Avatar url={msg.author_avatar_url} name={msg.author_name} size="sm" />
        <a
          href={`/u/${msg.author_handle || msg.author_id}`}
          className="text-caption font-bold uppercase hover:text-blue"
        >
          {msg.author_name}
          {msg.author_handle ? ` · @${msg.author_handle}` : ""}
        </a>
        <time className="ml-auto shrink-0 text-caption uppercase opacity-60">
          {formatPostDate(msg.created_at)}
        </time>
      </div>
      <p className="whitespace-pre-wrap break-words text-body">
        <MessageBody body={msg.body} />
      </p>
      {canDelete ? (
        <form action={deleteGroupMessage} className="mt-0.5">
          <input type="hidden" name="id" value={msg.id} />
          <input type="hidden" name="slug" value={slug} />
          <button className="text-caption font-bold uppercase opacity-60 hover:text-red hover:opacity-100">
            Delete
          </button>
        </form>
      ) : null}
    </div>
  );
}

function ReplyForm({
  groupId,
  slug,
  parentId,
}: {
  groupId: string;
  slug: string;
  parentId: string;
}) {
  return (
    <form action={postGroupMessage} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="parent_id" value={parentId} />
      <textarea
        name="body"
        required
        rows={2}
        maxLength={4000}
        placeholder="Reply… @mention or paste a link"
        className={FIELD}
      />
      <button className="self-start border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
        Reply
      </button>
    </form>
  );
}

export function GroupDiscussion({
  threads,
  access,
  groupId,
  slug,
  viewerId,
  isOwner,
}: {
  threads: GroupThread[];
  access: DiscussionAccess;
  groupId: string;
  slug: string;
  viewerId: string | null;
  isOwner: boolean;
}) {
  const canDelete = (authorId: string) => isOwner || viewerId === authorId;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-caption font-bold uppercase opacity-70">{access.label}</p>

      {access.canPostTop ? (
        <form action={postGroupMessage} className="flex flex-col gap-2">
          <input type="hidden" name="group_id" value={groupId} />
          <input type="hidden" name="slug" value={slug} />
          <textarea
            name="body"
            required
            rows={3}
            maxLength={4000}
            data-discussion-compose
            placeholder="Say something to the group… @mention people, paste a post or Astelier link"
            className={FIELD}
          />
          <button className="self-start border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
            Post
          </button>
        </form>
      ) : (
        <p className="border-2 border-dashed border-ink/40 px-3 py-2 text-caption font-bold uppercase opacity-70">
          {access.canReply
            ? "Only owners start threads here — you can reply below."
            : "Only owners post here."}
        </p>
      )}

      {threads.length === 0 ? (
        <p className="text-body opacity-70">No messages yet.</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {threads.map((t) => (
            <li key={t.id} className="border-2 border-ink p-3">
              <MessageRow msg={t} slug={slug} canDelete={canDelete(t.author_id)} />

              {t.replies.length ? (
                <ul className="mt-3 flex flex-col gap-3 border-l-2 border-ink/30 pl-3">
                  {t.replies.map((r) => (
                    <li key={r.id}>
                      <MessageRow msg={r} slug={slug} canDelete={canDelete(r.author_id)} />
                    </li>
                  ))}
                </ul>
              ) : null}

              {access.canReply ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-caption font-bold uppercase opacity-70 hover:opacity-100">
                    Reply
                  </summary>
                  <ReplyForm groupId={groupId} slug={slug} parentId={t.id} />
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
