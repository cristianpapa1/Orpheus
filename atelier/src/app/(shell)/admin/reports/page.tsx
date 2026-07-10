import { notFound } from "next/navigation";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { setReportStatus } from "@/lib/moderation/actions";
import { getReports } from "@/lib/moderation/queries";
import { REASON_LABEL } from "@atelier/core/moderation/types";
import { isViewerAdmin } from "@/lib/donations/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Moderation — Atelier admin" };

export default async function AdminReportsPage() {
  if (!(await isViewerAdmin())) notFound();

  const configured = isSupabaseConfigured();
  const reports = await getReports();
  const open = reports.filter((r) => r.status === "open");
  const resolved = reports.filter((r) => r.status !== "open");

  return (
    <div>
      <h1 className="mb-2 text-h1 font-bold uppercase">Moderation queue</h1>
      <p className="mb-6 max-w-2xl text-body">
        Reports from the community, oldest wounds first. Review, dismiss, or
        action — every decision is logged by status.
      </p>
      {!configured ? (
        <p data-setup-notice className="mb-4 border-2 border-ink bg-yellow px-3 py-2 text-caption font-bold uppercase">
          Preview mode — demo report shown
        </p>
      ) : null}

      <WindowGrid>
        <Window title={`Open (${open.length})`} accent="red" span="col-span-12">
          {open.length === 0 ? (
            <p className="text-body opacity-70">Queue is clear.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {open.map((r) => (
                <li key={r.id} data-report={r.id} className="border-2 border-ink p-4">
                  <p className="text-caption font-bold uppercase">
                    {REASON_LABEL[r.reason]} · {r.subject_type} {r.subject_id.slice(0, 12)}… ·
                    by @{r.reporter_handle} · {r.created_at.slice(0, 10)}
                  </p>
                  {r.detail ? <p className="mt-2 text-body">{r.detail}</p> : null}
                  <div className="mt-3 flex gap-2">
                    {(["reviewed", "dismissed", "actioned"] as const).map((s) => (
                      <form key={s} action={setReportStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value={s} />
                        <button disabled={!configured}
                          className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-ink hover:text-paper disabled:opacity-50">
                          {s}
                        </button>
                      </form>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Window>

        {resolved.length > 0 ? (
          <Window title="Resolved" accent="blue" span="col-span-12">
            <ul className="flex flex-col gap-1">
              {resolved.map((r) => (
                <li key={r.id} className="flex justify-between gap-2 text-caption uppercase opacity-70">
                  <span>{REASON_LABEL[r.reason]} · {r.subject_type}</span>
                  <span>{r.status}</span>
                </li>
              ))}
            </ul>
          </Window>
        ) : null}
      </WindowGrid>
    </div>
  );
}
