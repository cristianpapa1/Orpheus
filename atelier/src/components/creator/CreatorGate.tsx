import Link from "next/link";
import type { CreatorStatus } from "@/lib/profile/queries";

/**
 * Shown where a common member hits a creator-only surface (the composer, group
 * creation). Speaks to their actual status: pending → "under review", otherwise
 * → an invitation to apply. The database (0026 RLS) is the real gate; this is
 * the humane version of the same rule.
 */
export function CreatorGate({
  status,
  action,
}: {
  status: CreatorStatus;
  /** What they'd be doing, e.g. "publish work" or "start a group". */
  action: string;
}) {
  if (status === "pending") {
    return (
      <div data-creator-gate="pending" className="flex flex-col gap-3">
        <p className="text-h2 font-bold uppercase">Under review</p>
        <p className="text-body">
          Your creator application is with us. We&apos;ll email you the moment
          you&apos;re approved — then you can {action}. Until then, browse, follow,
          and join groups.
        </p>
        <Link
          href="/creator/apply"
          className="self-start border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
        >
          Check your status →
        </Link>
      </div>
    );
  }

  return (
    <div data-creator-gate="locked" className="flex flex-col gap-3">
      <p className="text-h2 font-bold uppercase">Creators only</p>
      <p className="text-body">
        To {action} you need creator access. Tell us what you make and share a
        couple of links — a quick manual review keeps the space real, and
        we&apos;ll email you when you&apos;re in.
      </p>
      <Link
        href="/creator/apply"
        className="self-start border-2 border-ink bg-ink px-5 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
      >
        Become a creator →
      </Link>
    </div>
  );
}
