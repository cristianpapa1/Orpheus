import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getChatThreads } from "@/lib/chat/queries";
import type { ChatThread } from "@/lib/chat/types";

function ThreadRow({ t, request }: { t: ChatThread; request?: boolean }) {
  return (
    <Window
      title={request ? `Request · ${t.other_name}` : t.other_name}
      accent={request ? "red" : "blue"}
      span="col-span-12"
    >
      <Link href={`/chat/${t.id}`} className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center border-2 border-ink bg-ink text-caption font-bold uppercase text-paper"
          >
            {t.other_name.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="text-body font-bold">
              {t.other_name}
              <span className="ml-2 text-caption font-normal uppercase opacity-60">
                @{t.other_handle}
              </span>
            </p>
            {t.last_message ? (
              <p className="truncate text-caption opacity-60">{t.last_message}</p>
            ) : null}
          </div>
        </div>
        <span className="shrink-0 text-caption font-bold uppercase hover:text-blue">
          {request ? "Review →" : "Open →"}
        </span>
      </Link>
    </Window>
  );
}

export default async function ChatListPage() {
  const threads = await getChatThreads();
  const requests = threads.filter((t) => t.is_request);
  const main = threads.filter((t) => !t.is_request);

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold uppercase">Messages</h1>

      {requests.length > 0 ? (
        <section data-contact-requests className="mb-8">
          <h2 className="mb-4 text-h2 font-bold uppercase">
            Contact requests
            <span className="ml-2 border-2 border-ink bg-red px-2 text-caption font-bold text-paper">
              {requests.length}
            </span>
          </h2>
          <p className="mb-4 max-w-2xl text-body opacity-70">
            People you don&apos;t follow back reached out. Open to read, then
            accept to keep chatting or dismiss.
          </p>
          <WindowGrid>
            {requests.map((t) => (
              <ThreadRow key={t.id} t={t} request />
            ))}
          </WindowGrid>
        </section>
      ) : null}

      {main.length === 0 ? (
        <WindowGrid>
          <Window title="Messages" accent="blue" span="col-span-12 md:col-span-6">
            <p className="text-h2 font-bold uppercase">No conversations yet.</p>
            <p className="mt-4 max-w-md text-body">
              Visit a creator&rsquo;s profile and hit Message to start a
              conversation. Only you and the other person can see what&rsquo;s
              shared here.
            </p>
          </Window>
        </WindowGrid>
      ) : (
        <WindowGrid>
          {main.map((t) => (
            <ThreadRow key={t.id} t={t} />
          ))}
        </WindowGrid>
      )}
    </div>
  );
}
