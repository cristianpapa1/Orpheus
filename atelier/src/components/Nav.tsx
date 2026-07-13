"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/feed", label: "Feed", accent: "bg-red" },
  { href: "/groups", label: "Groups", accent: "bg-blue" },
  { href: "/chat", label: "Chat", accent: "bg-yellow" },
  { href: "/profile", label: "Profile", accent: "bg-yellow" },
] as const;

export function Nav({
  email,
  unread = 0,
}: {
  email: string | null;
  unread?: number;
}) {
  const pathname = usePathname();

  return (
    <header className="border-b-2 border-ink bg-paper">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6">
        <Link href="/feed" className="flex items-center gap-3 py-4">
          <span className="flex gap-1" aria-hidden>
            <span className="size-3 bg-red" />
            <span className="size-3 bg-blue" />
            <span className="size-3 bg-yellow" />
          </span>
          <span className="text-h2 font-bold uppercase tracking-tight">
            Atelier
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-stretch gap-6 md:flex">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 border-b-4 py-4 text-caption font-bold uppercase ${
                  active ? "border-ink" : "border-transparent"
                }`}
              >
                <span
                  aria-hidden
                  className={`size-2 ${tab.accent} ${active ? "" : "opacity-30"}`}
                />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <form action="/search" className="hidden md:block">
            <input
              name="q"
              placeholder="Search"
              aria-label="Search"
              className="w-28 border-2 border-ink bg-paper px-2 py-1 text-caption uppercase outline-none transition-all focus:w-44 focus:border-blue"
            />
          </form>
          {/* No email/name here; sign out lives on the profile page. */}
          {email ? (
            <Link
              href="/notifications"
              data-notif-bell
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
              className={`relative border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow ${
                pathname.startsWith("/notifications") ? "bg-ink text-paper" : ""
              }`}
            >
              Alerts
              {unread > 0 ? (
                <span
                  data-unread
                  className="ml-1 inline-block min-w-4 border-2 border-ink bg-red px-1 text-center text-caption font-bold text-paper"
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
            </Link>
          ) : (
            <Link
              href="/login"
              className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
