import { MessageBody } from "@/components/chat/MessageBody";
import { Avatar } from "@/components/profile/Avatar";
import { formatPostDate } from "@atelier/core/posts/types";
import {
  postGroupMessage,
  deleteGroupMessage,
} from "@/app/(shell)/groups/discussion-actions";
import type {
  GroupMessage,
  GroupThreadDetail,
  DiscussionAccess,
} from "@/lib/groups/discussion";

const FIELD =
  "w-full border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue";

function MessageRow({
  msg,
  slug,
  threadId,
  isOpening,
  canDelete,
}: {
  msg: GroupMessage;
  slug: string;
  threadId: string;
  isOpening: boolean;
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
          <input type="hidden" name="thread_id" value={threadId} />
          {isOpening ? <input type="hidden" name="opening" value="1" /> : null}
          <button className="text-caption font-bold uppercase opacity-60 hover:text-red hover:opacity-100">
            {isOpening ? "Delete discussion" : "Delete"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function GroupThreadView({
  detail,
  access,
  groupId,
  slug,
  viewerId,
  isOwner,
}: {
  detail: GroupThreadDetail;
  access: DiscussionAccess;
  groupId: string;
  slug: string;
  viewerId: string | null;
  isOwner: boolean;
}) {
  const { thread, replies } = detail;
  const canDelete = (authorId: string) => isOwner || viewerId === authorId;

  return (
    <div className="flex flex-col gap-5">
      {thread.title ? (
        <h1 className="text-h2 font-bold uppercase">{thread.title}</h1>
      ) : null}

      <div className="border-2 border-ink p-3">
        <MessageRow
          msg={thread}
          slug={slug}
          threadId={thread.id}
          isOpening
          canDelete={canDelete(thread.author_id)}
        />
      </div>

      <div>
        <p className="mb-2 text-caption font-bold uppercase opacity-70">
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </p>
        {replies.length ? (
          <ul className="flex flex-col gap-3 border-l-2 border-ink/30 pl-3">
            {replies.map((r) => (
              <li key={r.id}>
                <MessageRow
                  msg={r}
                  slug={slug}
                  threadId={thread.id}
                  isOpening={false}
                  canDelete={canDelete(r.author_id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body opacity-70">No replies yet.</p>
        )}
      </div>

      {access.canReply ? (
        <form action={postGroupMessage} className="flex flex-col gap-2">
          <input type="hidden" name="group_id" value={groupId} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="parent_id" value={thread.id} />
          <textarea
            name="body"
            required
            rows={3}
            maxLength={4000}
            data-reply-compose
            placeholder="Reply… @mention or paste a link"
            className={FIELD}
          />
          <button className="self-start border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
            Reply
          </button>
        </form>
      ) : (
        <p className="border-2 border-dashed border-ink/40 px-3 py-2 text-caption font-bold uppercase opacity-70">
          You can read this discussion, but only members may reply.
        </p>
      )}
    </div>
  );
}
