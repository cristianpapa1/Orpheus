import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { isStripeConfigured } from "@/lib/donations/stripe";
import {
  DONATION_PRESETS_CENTS,
  formatMoney,
} from "@atelier/core/donations/types";
import { createDonationCheckout } from "./actions";

export const metadata = { title: "Support Atelier — Donate" };

const ERRORS: Record<string, string> = {
  unconfigured: "Donations aren't live yet — Stripe isn't configured.",
  amount: "Enter an amount of at least €1.",
  stripe: "Checkout couldn't start. Try again.",
};

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; thanks?: string; appeal?: string }>;
}) {
  const { error, thanks, appeal } = await searchParams;
  const configured = isStripeConfigured();

  return (
    <main className="mx-auto w-full max-w-5xl grow px-6 py-12">
      <h1 className="mb-6 text-h1 font-bold uppercase">Keep Atelier alive</h1>
      <WindowGrid>
        <Window title="What this funds" accent="blue" span="col-span-12 md:col-span-6">
          <p data-honest-copy className="text-body">
            Atelier has no ads, no promoted posts, and no marketplace fees —
            on purpose. What you see is only what you follow. That means the
            servers, image storage, and database are paid for by the people
            who use this place. Donations are the <strong>only</strong> money
            that comes in.
          </p>
          <p className="mt-3 text-body">
            No perks, no badges, no boosted reach for donors — that would
            break the whole point. Just the bill, split voluntarily.
          </p>
        </Window>

        <Window title="Donate" accent="red" span="col-span-12 md:col-span-6">
          {thanks ? (
            <p role="status" className="mb-4 border-2 border-ink bg-yellow px-3 py-2 text-caption font-bold uppercase">
              Thank you. Receipt is on its way to your inbox.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="mb-4 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
              {ERRORS[error] ?? "Something went wrong."}
            </p>
          ) : null}
          {!configured ? (
            <p data-setup-notice className="mb-4 border-2 border-ink bg-yellow px-3 py-2 text-caption font-bold uppercase">
              Preview mode — add STRIPE_SECRET_KEY to enable donations
            </p>
          ) : null}

          <form action={createDonationCheckout} data-donate-form className="flex flex-col gap-4">
            {appeal ? <input type="hidden" name="appeal" value={appeal} /> : null}

            <p className="text-caption font-bold uppercase">Amount</p>
            <div className="flex flex-wrap gap-2">
              {DONATION_PRESETS_CENTS.map((cents, i) => (
                <label key={cents} className="cursor-pointer">
                  <input
                    type="radio"
                    name="preset"
                    value={cents}
                    defaultChecked={i === 1}
                    className="peer sr-only"
                  />
                  <span className="inline-block border-2 border-ink px-4 py-2 text-body font-bold peer-checked:bg-ink peer-checked:text-paper">
                    {formatMoney(cents)}
                  </span>
                </label>
              ))}
              <label className="cursor-pointer">
                <input type="radio" name="preset" value="" className="peer sr-only" />
                <span className="inline-block border-2 border-ink px-4 py-2 text-body font-bold peer-checked:bg-ink peer-checked:text-paper">
                  Custom
                </span>
              </label>
            </div>
            <input
              aria-label="Custom amount in euros"
              name="custom"
              inputMode="decimal"
              placeholder="Custom amount (€)"
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
            />

            <p className="text-caption font-bold uppercase">Frequency</p>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input type="radio" name="kind" value="one_off" defaultChecked className="peer sr-only" />
                <span className="inline-block border-2 border-ink px-4 py-2 text-caption font-bold uppercase peer-checked:bg-ink peer-checked:text-paper">
                  One-off
                </span>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="kind" value="recurring" className="peer sr-only" />
                <span className="inline-block border-2 border-ink px-4 py-2 text-caption font-bold uppercase peer-checked:bg-ink peer-checked:text-paper">
                  Monthly
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!configured}
              className="self-start border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:bg-red hover:border-red disabled:opacity-50"
            >
              Donate via Stripe →
            </button>
            <p className="text-caption uppercase opacity-70">
              Card handling and receipts by Stripe — we never see your card
            </p>
          </form>
        </Window>
      </WindowGrid>
    </main>
  );
}
