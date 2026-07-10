import Link from "next/link";
import { dismissAppeal } from "@/app/appeal-actions";
import type { Appeal } from "@/lib/donations/types";
import { formatMoney, progressPct } from "@/lib/donations/types";

/**
 * The in-app channel for a manually-triggered donation appeal.
 * Deliberately non-intrusive: one slim banner, dismissible, never a modal.
 * Server-rendered; dismissal is a cookie (see appeal-actions), so there is
 * no hydration flash and the state is verifiable in served HTML.
 */
export function AppealBanner({
  appeal,
  raisedCents,
}: {
  appeal: Appeal;
  raisedCents: number;
}) {
  const pct = progressPct(raisedCents, appeal.goal_cents);

  return (
    <aside
      data-appeal-banner={appeal.id}
      className="border-b-2 border-ink bg-paper px-6 py-2"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3">
        <span aria-hidden className="size-2 shrink-0 bg-red" />
        <p className="text-caption font-bold uppercase">{appeal.title}</p>
        <p className="hidden text-caption md:block">{appeal.message}</p>
        {pct !== null ? (
          <span data-appeal-progress className="flex items-center gap-2">
            <span className="inline-block h-2 w-24 border-2 border-ink">
              <span
                className="block h-full bg-blue"
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="text-caption font-bold uppercase">
              {formatMoney(raisedCents)} / {formatMoney(appeal.goal_cents!)}
            </span>
          </span>
        ) : null}
        <Link
          href={`/donate?appeal=${appeal.id}`}
          className="border-2 border-ink px-3 py-0.5 text-caption font-bold uppercase hover:bg-red hover:border-red hover:text-paper"
        >
          Chip in
        </Link>
        <form action={dismissAppeal} className="ml-auto">
          <input type="hidden" name="id" value={appeal.id} />
          <button
            type="submit"
            aria-label="Dismiss appeal banner"
            className="px-2 font-bold hover:text-red"
          >
            ×
          </button>
        </form>
      </div>
    </aside>
  );
}
