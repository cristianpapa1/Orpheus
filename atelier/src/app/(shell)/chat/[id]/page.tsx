import { notFound } from "next/navigation";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getThreadMessages } from "@/lib/chat/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ThreadMessages } from "./ThreadMessages";
import { acceptRequest, dismissRequest } from "../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ThreadPage({ params }: Props) {
  const { id } = await params;
  const { thread, messages } = await getThreadMessages(id);
  if (!thread) notFound();

  const viewerId = isSupabaseConfigured() ? null : "demo-you";

  return (
    <div>
      {thread.is_request ? (
        <div
          data-request-banner
          className="mb-4 flex flex-wrap items-center gap-3 border-2 border-ink bg-yellow px-4 py-3"
        >
          <span className="text-caption font-bold uppercase">
            Contact request from {thread.other_name}
          </span>
          <form action={acceptRequest}>
            <input type="hidden" name="thread_id" value={thread.id} />
            <button className="border-2 border-ink bg-ink px-4 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
              Accept
            </button>
          </form>
          <form action={dismissRequest}>
            <input type="hidden" name="thread_id" value={thread.id} />
            <button className="border-2 border-ink px-4 py-1 text-caption font-bold uppercase hover:bg-red hover:border-red hover:text-paper">
              Dismiss
            </button>
          </form>
        </div>
      ) : null}
      <WindowGrid>
        <Window
          title={`${thread.other_name} — @${thread.other_handle}`}
          accent="blue"
          span="col-span-12 md:col-span-8"
        >
          <ThreadMessages
            threadId={thread.id}
            messages={messages}
            otherName={thread.other_name}
            viewerId={viewerId}
            locked={thread.is_request}
          />
        </Window>

        <Window title="About this chat" accent="yellow" span="col-span-12 md:col-span-4">
          <p className="text-body">
            Only you and {thread.other_name} can see these messages.
            Conversations are private by design.
          </p>
        </Window>
      </WindowGrid>
    </div>
  );
}
