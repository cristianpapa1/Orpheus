import { notFound } from "next/navigation";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getThreadMessages } from "@/lib/chat/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ThreadMessages } from "./ThreadMessages";

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
