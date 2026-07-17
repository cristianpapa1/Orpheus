import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import type { CreatorStatus } from "@/lib/profile/queries";

/**
 * Shown where a common member hits a creator-only surface (the composer, group
 * creation). Speaks to their status: pending → "under review", otherwise → an
 * invitation to apply. The database (0026 RLS) is the real gate; this is the
 * humane version of the same rule.
 */
export async function CreatorGate({ status }: { status: CreatorStatus }) {
  const { t } = await getI18n();
  const g = t.creatorGate;

  if (status === "pending") {
    return (
      <div data-creator-gate="pending" className="flex flex-col gap-3">
        <p className="text-h2 font-bold uppercase">{g.underReview}</p>
        <p className="text-body">{g.underReviewBody}</p>
        <Link
          href="/creator/apply"
          className="self-start border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
        >
          {g.checkStatus}
        </Link>
      </div>
    );
  }

  return (
    <div data-creator-gate="locked" className="flex flex-col gap-3">
      <p className="text-h2 font-bold uppercase">{g.creatorsOnly}</p>
      <p className="text-body">{g.creatorsOnlyBody}</p>
      <Link
        href="/creator/apply"
        className="self-start border-2 border-ink bg-ink px-5 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
      >
        {g.becomeCreator}
      </Link>
    </div>
  );
}
