import { notFound } from "next/navigation";
import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { Avatar } from "@/components/profile/Avatar";
import { formatPostDate } from "@atelier/core/posts/types";
import {
  getPendingCreatorApplications,
  getResolvedCreatorApplications,
} from "@/lib/profile/queries";
import { isViewerAdmin } from "@/lib/donations/queries";
import { approveCreator, rejectCreator } from "./actions";

export const metadata = { title: "Admissions — Atelier admin" };

const ERRORS: Record<string, string> = {
  forbidden: "You're not an admin.",
  resolve: "Couldn't update the application.",
  assign: "Couldn't update the applicant's access.",
  service: "Service role not configured.",
  bad: "Missing application details.",
  unavailable: "Preview mode — admissions need Supabase configured.",
};

export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; approved?: string; rejected?: string }>;
}) {
  // Non-admins get a 404 — the page's existence isn't leaked.
  if (!(await isViewerAdmin())) notFound();

  const { error, approved, rejected } = await searchParams;
  const [pending, history] = await Promise.all([
    getPendingCreatorApplications(),
    getResolvedCreatorApplications(),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-h1 font-bold uppercase">Admissions</h1>
      <p className="mb-6 max-w-2xl text-body">
        People who asked for creator access — the right to publish work and start
        groups. Read what they intend to post and the links they gave as proof,
        then approve or decline. Approving emails them and unlocks the composer.
      </p>

      {error ? (
        <p role="alert" className="mb-4 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
          {ERRORS[error] ?? "Something went wrong."}
        </p>
      ) : null}
      {approved ? (
        <p role="status" className="mb-4 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
          Approved — they're a creator now.
        </p>
      ) : null}
      {rejected ? (
        <p role="status" className="mb-4 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
          Application declined.
        </p>
      ) : null}

      {pending.length === 0 ? (
        <WindowGrid>
          <Window title="Inbox zero" accent="blue" span="col-span-12 md:col-span-6">
            <p className="text-body">No applications waiting for review.</p>
          </Window>
        </WindowGrid>
      ) : (
        <WindowGrid>
          {pending.map((a, i) => (
            <div key={a.id} data-application={a.id} className="col-span-12 flex flex-col md:col-span-6">
              <Window
                title={`Applied ${formatPostDate(a.created_at)}`}
                accent={(["red", "blue", "yellow"] as const)[i % 3]}
                className="h-full"
              >
                <div className="flex items-center gap-2">
                  <Avatar url={a.applicant_avatar_url} name={a.applicant_name} size="sm" />
                  <Link href={`/u/${a.applicant_handle || a.profile_id}`} className="text-body font-bold hover:text-blue">
                    {a.applicant_name}
                    {a.applicant_handle ? ` · @${a.applicant_handle}` : ""}
                  </Link>
                </div>

                <p className="mt-3 whitespace-pre-wrap break-words border-2 border-ink bg-ink/5 p-3 text-body">
                  {a.statement}
                </p>

                {a.links.length > 0 ? (
                  <ul data-application-links className="mt-3 flex flex-col gap-1">
                    {a.links.map((l) => (
                      <li key={l}>
                        <a
                          href={l}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="break-all border-b-2 border-ink text-caption font-bold hover:text-blue"
                        >
                          {l} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-caption uppercase opacity-70">No links provided.</p>
                )}

                <div className="mt-4 flex flex-wrap items-start gap-2">
                  <form action={approveCreator}>
                    <input type="hidden" name="application_id" value={a.id} />
                    <input type="hidden" name="profile_id" value={a.profile_id} />
                    <button className="border-2 border-ink bg-ink px-4 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
                      Approve
                    </button>
                  </form>
                  <form action={rejectCreator} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="application_id" value={a.id} />
                    <input type="hidden" name="profile_id" value={a.profile_id} />
                    <input
                      name="note"
                      maxLength={500}
                      placeholder="Reason (optional)"
                      className="border-2 border-ink bg-paper px-2 py-1 text-caption outline-none focus:border-blue"
                    />
                    <button className="border-2 border-ink px-4 py-1 text-caption font-bold uppercase hover:bg-red hover:border-red hover:text-paper">
                      Decline
                    </button>
                  </form>
                </div>
              </Window>
            </div>
          ))}
        </WindowGrid>
      )}

      {history.length > 0 ? (
        <section data-admissions-history className="mt-8">
          <h2 className="mb-4 text-h2 font-bold uppercase">History</h2>
          <WindowGrid>
            <Window title={`Reviewed (${history.length})`} accent="blue" span="col-span-12">
              <ul className="flex flex-col gap-3">
                {history.map((a) => (
                  <li
                    key={a.id}
                    data-admissions-history-row
                    className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-3"
                  >
                    <span className="text-body">
                      <Link href={`/u/${a.applicant_handle || a.profile_id}`} className="font-bold hover:text-blue">
                        {a.applicant_name}
                        {a.applicant_handle ? ` · @${a.applicant_handle}` : ""}
                      </Link>
                      <span
                        data-application-status={a.status}
                        className={`ml-2 border-2 border-ink px-2 py-0.5 text-caption font-bold uppercase ${
                          a.status === "approved" ? "bg-ink text-paper" : ""
                        }`}
                      >
                        {a.status}
                      </span>
                    </span>
                    {a.reviewed_at ? (
                      <span className="text-caption uppercase opacity-60">
                        {a.reviewed_at.slice(0, 10)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Window>
          </WindowGrid>
        </section>
      ) : null}
    </div>
  );
}
