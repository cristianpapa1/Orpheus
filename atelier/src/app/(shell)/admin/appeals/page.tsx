import { notFound } from "next/navigation";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import {
  getAppealsWithResults,
  getLedger,
  isViewerAdmin,
} from "@/lib/donations/queries";
import {
  AUDIENCE_LABEL,
  formatMoney,
  progressPct,
} from "@/lib/donations/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAppeal, toggleAppeal } from "./actions";

export const metadata = { title: "Donation appeals — Atelier admin" };

export default async function AdminAppealsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  // Non-admins get a 404, not a 403 — the page's existence isn't leaked.
  if (!(await isViewerAdmin())) notFound();

  const { error, created } = await searchParams;
  const configured = isSupabaseConfigured();
  const appeals = await getAppealsWithResults();
  const ledger = await getLedger();

  return (
    <div>
      <h1 className="mb-2 text-h1 font-bold uppercase">Donation appeals</h1>
      <p className="mb-6 max-w-2xl text-body">
        Appeals are manual on purpose — fire one when costs are due, switch it
        off when the need passes. The platform never begs on its own.
      </p>

      {error ? (
        <p role="alert" className="mb-4 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
          That didn&apos;t work ({error}).
        </p>
      ) : null}
      {created ? (
        <p role="status" className="mb-4 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
          Appeal created.
        </p>
      ) : null}
      {!configured ? (
        <p data-setup-notice className="mb-4 border-2 border-ink bg-yellow px-3 py-2 text-caption font-bold uppercase">
          Preview mode — demo appeal and ledger shown below
        </p>
      ) : null}

      <WindowGrid>
        <Window title="New appeal" accent="red" span="col-span-12 md:col-span-4">
          <form action={createAppeal} data-create-appeal className="flex flex-col gap-3">
            <label htmlFor="title" className="text-caption font-bold uppercase">Title</label>
            <input id="title" name="title" required minLength={3} maxLength={80} disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50" />

            <label htmlFor="message" className="text-caption font-bold uppercase">Message</label>
            <textarea id="message" name="message" rows={3} maxLength={600} disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50" />

            <label htmlFor="goal" className="text-caption font-bold uppercase">Goal (€, optional)</label>
            <input id="goal" name="goal" inputMode="decimal" placeholder="600" disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50" />

            <label htmlFor="audience" className="text-caption font-bold uppercase">Audience</label>
            <select id="audience" name="audience" disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50">
              <option value="everyone">Everyone</option>
              <option value="past_donors">Past donors</option>
              <option value="active_users">Active users</option>
            </select>

            <label className="flex items-center gap-2 text-caption font-bold uppercase">
              <input type="checkbox" name="active" defaultChecked disabled={!configured} className="size-4 accent-ink" />
              Send immediately (in-app banner)
            </label>

            <button type="submit" disabled={!configured}
              className="self-start border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-red hover:border-red disabled:opacity-50">
              Create appeal
            </button>
            <p className="text-caption uppercase opacity-70">
              Email delivery lands with the Resend integration — banner channel is live
            </p>
          </form>
        </Window>

        <Window title="Appeals & results" accent="blue" span="col-span-12 md:col-span-8">
          <ul className="flex flex-col gap-4">
            {appeals.map((a) => {
              const pct = progressPct(a.raised_cents, a.goal_cents);
              return (
                <li key={a.id} data-appeal={a.id} className="border-2 border-ink p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-h2 font-bold">{a.title}</p>
                    <span className={`border-2 border-ink px-2 py-0.5 text-caption font-bold uppercase ${a.active ? "bg-yellow" : ""}`}>
                      {a.active ? "Active" : "Off"}
                    </span>
                    <form action={toggleAppeal} className="ml-auto">
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="next" value={a.active ? "off" : "on"} />
                      <button disabled={!configured}
                        className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-ink hover:text-paper disabled:opacity-50">
                        {a.active ? "Switch off" : "Switch on"}
                      </button>
                    </form>
                  </div>
                  <p className="mt-2 text-body">{a.message}</p>
                  <p data-appeal-results className="mt-3 text-caption font-bold uppercase">
                    Raised {formatMoney(a.raised_cents)}
                    {a.goal_cents ? ` of ${formatMoney(a.goal_cents)} (${pct}%)` : ""} ·{" "}
                    {a.donation_count} donations · reach ~{a.reach} ({AUDIENCE_LABEL[a.audience]})
                  </p>
                  {pct !== null ? (
                    <span className="mt-2 inline-block h-3 w-full max-w-sm border-2 border-ink">
                      <span className="block h-full bg-blue" style={{ width: `${pct}%` }} />
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Window>

        <Window title="Ledger" accent="yellow" span="col-span-12">
          <table data-ledger className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-ink text-caption font-bold uppercase">
                <th className="py-2">When</th>
                <th>Donor</th>
                <th>Kind</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((d) => (
                <tr key={d.id} className="border-b border-ink/20 text-body">
                  <td className="py-2">{d.created_at.slice(0, 10)}</td>
                  <td>{d.donor_label}</td>
                  <td className="uppercase">{d.kind === "recurring" ? "Monthly" : "One-off"}</td>
                  <td className="text-right font-bold">{formatMoney(d.amount_cents, d.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Window>
      </WindowGrid>
    </div>
  );
}
