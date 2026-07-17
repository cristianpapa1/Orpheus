import { notFound } from "next/navigation";
import Link from "next/link";
import { Window, type WindowAccent } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { isViewerAdmin } from "@/lib/donations/queries";

export const metadata = { title: "Admin — Atelier" };

const TOOLS: { href: string; title: string; accent: WindowAccent; body: string }[] = [
  {
    href: "/admin/content",
    title: "Content",
    accent: "red",
    body: "Browse recent posts and groups and remove anything that doesn't belong.",
  },
  {
    href: "/admin/reports",
    title: "Reports",
    accent: "blue",
    body: "The moderation queue — community reports and AI-flagged posts. Review, dismiss, take down.",
  },
  {
    href: "/admin/admissions",
    title: "Creator admissions",
    accent: "yellow",
    body: "Review who asked to become a creator — approve or reject the ability to publish work and start groups.",
  },
  {
    href: "/admin/claims",
    title: "Profile claims",
    accent: "yellow",
    body: "Approve, reject, and revoke requests to claim community institution profiles.",
  },
  {
    href: "/admin/quality",
    title: "Quality stamps",
    accent: "blue",
    body: "Review eligible members and grant the quality stamp — trusted reviewers who flag low-quality work.",
  },
  {
    href: "/admin/appeals",
    title: "Donation appeals",
    accent: "red",
    body: "Fire a funding appeal when costs are due; switch it off when the need passes.",
  },
];

export default async function AdminHome() {
  if (!(await isViewerAdmin())) notFound();

  return (
    <div>
      <h1 className="mb-2 text-h1 font-bold uppercase">Admin console</h1>
      <p className="mb-6 max-w-2xl text-body">
        Everything you can steward from here. Every action is admin-gated and
        logged; destructive ones use elevated access deliberately.
      </p>
      <WindowGrid>
        {TOOLS.map((t) => (
          <div key={t.href} className="col-span-12 flex flex-col md:col-span-6">
            <Window title={t.title} accent={t.accent} className="h-full">
              <p className="text-body">{t.body}</p>
              <Link
                href={t.href}
                className="mt-4 inline-block border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
              >
                Open →
              </Link>
            </Window>
          </div>
        ))}
      </WindowGrid>
    </div>
  );
}
