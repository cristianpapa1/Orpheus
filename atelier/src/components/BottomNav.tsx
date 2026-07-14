"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Profile is NOT here — it lives in the top-right button (with the unread
// interactions badge), same as desktop. These are the three primary feeds.
const TABS = [
  { href: "/feed", label: "Feed", accent: "bg-red" },
  { href: "/groups", label: "Groups", accent: "bg-blue" },
  { href: "/chat", label: "Chat", accent: "bg-yellow" },
] as const;

/**
 * Mobile bottom tab bar (M1) — thumb-reach navigation on small screens,
 * mirroring the future native app's tabs. Hidden on md+ where the top
 * nav takes over. Safe-area padded for iOS home indicators.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      data-bottom-nav
      aria-label="Primary, mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-3">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
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
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
