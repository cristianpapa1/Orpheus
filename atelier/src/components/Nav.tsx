"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/feed", label: "Feed", accent: "bg-red" },
  { href: "/groups", label: "Groups", accent: "bg-blue" },
  { href: "/chat", label: "Chat", accent: "bg-yellow" },
  { href: "/profile", label: "Profile", accent: "bg-yellow" },
] as const;

export function Nav({ email }: { email: string | null }) {
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
          {/* No email/name here; sign out lives on the profile page. */}
          {email ? null : (
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
