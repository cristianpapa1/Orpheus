"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/context";

const TABS = [
  { href: "/", key: "home", accent: "bg-red" },
  { href: "/browse", key: "browse", accent: "bg-blue" },
  { href: "/search", key: "search", accent: "bg-yellow" },
  { href: "/sell", key: "sell", accent: "bg-ink" },
] as const;

/** Mobile thumb-reach nav. Hidden on md+, where the top nav takes over. */
export function BottomNav() {
  const pathname = usePathname();
  const t = useT().bottomNav;
  return (
    <nav
      data-bottom-nav
      aria-label="Primary, mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2 text-caption font-bold uppercase ${
                active ? "bg-ink text-paper" : ""
              }`}
            >
              <span aria-hidden className={`size-2 ${tab.accent}`} />
              {t[tab.key]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
