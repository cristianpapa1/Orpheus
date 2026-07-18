"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const TABS = [
  { href: "/feed", key: "feed", accent: "bg-red" },
  { href: "/heroes", key: "heroes", accent: "bg-blue" },
  { href: "/groups", key: "groups", accent: "bg-yellow" },
  { href: "/chat", key: "chat", accent: "bg-red" },
] as const;

export function Nav({
  email,
  unread = 0,
  t,
}: {
  email: string | null;
  unread?: number;
  t: Dictionary["nav"];
}) {
  const pathname = usePathname();

  return (
    <header className="border-b-2 border-ink bg-paper">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6">
        <Link href="/feed" className="flex items-center gap-3 py-4">
          <span className="flex items-center gap-1" aria-hidden>
            <span className="size-3 bg-red" />
            <span className="size-3 bg-blue [clip-path:polygon(50%_0%,100%_100%,0%_100%)]" />
            <span className="size-3 rounded-full bg-yellow" />
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
                {t[tab.key]}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <form action="/search" className="hidden md:block">
            <input
              name="q"
              placeholder={t.search}
              aria-label={t.search}
              className="w-28 border-2 border-ink bg-paper px-2 py-1 text-caption uppercase outline-none transition-all focus:w-44 focus:border-blue"
            />
          </form>
          {/* No email/name here; sign out lives on the profile page. */}
          {email ? (
            <Link
              href="/profile"
              data-profile-link
              aria-label={
                unread > 0 ? `${t.profile}, ${unread} ${t.interactions}` : t.profile
              }
              className={`relative border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow ${
                pathname.startsWith("/profile") ? "bg-ink text-paper" : ""
              }`}
            >
              {t.profile}
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
              {t.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
