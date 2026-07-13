import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import {
  getNotifications,
  type NotificationItem,
} from "@/lib/notifications/queries";
import { markAllRead } from "./actions";

export const metadata = { title: "Notifications — Atelier" };

function describe(n: NotificationItem): { text: string; href: string } {
  const who = n.actor_name;
  const post = `/p/${n.subject_id ?? ""}`;
  switch (n.type) {
    case "favorite":
      return { text: `${who} favorited your work`, href: post };
    case "mention":
      return { text: `${who} mentioned you in a post`, href: post };
    case "comment":
      return { text: `${who} commented on your work`, href: post };
    case "share":
      return { text: `${who} shared a post with you`, href: post };
    case "follow":
      return {
        text: `${who} followed you`,
        href: `/u/${n.actor_handle || n.subject_id || ""}`,
      };
    case "claim_approved":
      return {
        text: `Your claim was approved — you now manage a profile`,
        href: `/u/${n.subject_id ?? ""}`,
      };
    default:
      return { text: `${who} did something`, href: "/feed" };
  }
}

export default async function NotificationsPage() {
  const items = await getNotifications();
  const hasUnread = items.some((n) => !n.read_at);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1 font-bold uppercase">Notifications</h1>
        {hasUnread ? (
          <form action={markAllRead}>
            <button className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow">
              Mark all read
            </button>
          </form>
        ) : null}
      </div>

      {items.length === 0 ? (
        <WindowGrid>
          <Window title="Quiet" accent="blue" span="col-span-12 md:col-span-8">
            <p className="text-body">
              Nothing yet. When someone favorites your work, mentions you,
              comments, or follows you, it shows up here.
            </p>
          </Window>
        </WindowGrid>
      ) : (
        <ul data-notifications className="flex flex-col gap-2">
          {items.map((n) => {
            const { text, href } = describe(n);
            return (
              <li key={n.id} data-notification data-read={n.read_at ? "1" : "0"}>
                <Link
                  href={href}
                  className={`flex items-baseline justify-between gap-3 border-2 border-ink px-4 py-3 hover:bg-yellow ${
                    n.read_at ? "opacity-60" : "bg-paper"
                  }`}
                >
                  <span className="text-body">
                    {!n.read_at ? (
                      <span aria-hidden className="mr-2 inline-block size-2 bg-red align-middle" />
                    ) : null}
                    {text}
                  </span>
                  <time className="shrink-0 text-caption uppercase opacity-70">
                    {n.created_at.slice(0, 10)}
                  </time>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
