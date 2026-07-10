import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getChatThreads } from "@/lib/chat/queries";

export default async function ChatListPage() {
  const threads = await getChatThreads();

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold uppercase">Messages</h1>

      {threads.length === 0 ? (
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
          {threads.map((t) => (
            <Window
              key={t.id}
              title={t.other_name}
              accent="blue"
              span="col-span-12"
            >
              <Link
                href={`/chat/${t.id}`}
                className="flex items-center justify-between gap-4"
              >
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
                      <p className="truncate text-caption opacity-60">
                        {t.last_message}
                      </p>
                    ) : null}
                  </div>
                </div>
                <span className="shrink-0 text-caption font-bold uppercase hover:text-blue">
                  Open &rarr;
                </span>
              </Link>
            </Window>
          ))}
        </WindowGrid>
      )}
    </div>
  );
}
