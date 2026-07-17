import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getOwnJobs } from "@/lib/jobs/queries";
import {
  DISCIPLINE_LABEL,
  JOB_DISCIPLINES,
  JOB_STATUS_LABEL,
  WORK_MODES,
  WORK_MODE_LABEL,
} from "@atelier/core/jobs/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { CreatorGate } from "@/components/creator/CreatorGate";
import { getViewerCreatorStatus } from "@/lib/profile/queries";
import { createJob, setJobStatus } from "./actions";

export const metadata = { title: "Your job posts — Atelier" };

const ERRORS: Record<string, string> = {
  unavailable: "Preview mode — managing job posts needs Supabase configured.",
  locked: "Posting jobs is for approved creators.",
  title: "Titles are 3–80 characters.",
  discipline: "Pick a discipline.",
  url: "Apply links must start with http(s)://",
  create: "Couldn't save the job post. Try again.",
  status: "Invalid status.",
};

export default async function ProfileJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const { error, created } = await searchParams;
  const configured = isSupabaseConfigured();
  const creatorStatus = await getViewerCreatorStatus();
  const canPost = creatorStatus === "approved";
  const jobs = await getOwnJobs();

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold uppercase">Your job posts</h1>

      {error ? (
        <p role="alert" className="mb-4 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
          {ERRORS[error] ?? "Something went wrong."}
        </p>
      ) : null}
      {created ? (
        <p role="status" className="mb-4 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
          Posted — it&apos;s on your profile and in{" "}
          <Link href="/jobs" className="border-b-2 border-ink">discovery</Link>.
        </p>
      ) : null}

      <WindowGrid>
        <Window title="Post a job" accent="red" span="col-span-12 md:col-span-5">
          {!configured ? (
            <p data-setup-notice className="mb-3 border-2 border-ink bg-yellow px-3 py-2 text-caption font-bold uppercase">
              Preview mode — demo postings shown
            </p>
          ) : null}
          {configured && !canPost ? (
            <CreatorGate status={creatorStatus} />
          ) : (
          <form action={createJob} data-create-job className="flex flex-col gap-3">
            <label htmlFor="title" className="text-caption font-bold uppercase">Title</label>
            <input id="title" name="title" required minLength={3} maxLength={80} disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50" />

            <label htmlFor="discipline" className="text-caption font-bold uppercase">Discipline</label>
            <select id="discipline" name="discipline" required defaultValue="" disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50">
              <option value="" disabled>Pick one…</option>
              {JOB_DISCIPLINES.map((d) => (
                <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>
              ))}
            </select>

            <label htmlFor="description" className="text-caption font-bold uppercase">Description</label>
            <textarea id="description" name="description" rows={4} maxLength={2000} disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50" />

            <label htmlFor="work_mode" className="text-caption font-bold uppercase">Work mode</label>
            <select id="work_mode" name="work_mode" disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50">
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>{WORK_MODE_LABEL[m]}</option>
              ))}
            </select>
            <input aria-label="Location" name="location" maxLength={120} placeholder="City (if on-site)" disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50" />

            <label htmlFor="compensation" className="text-caption font-bold uppercase">
              Compensation (range or &ldquo;negotiable&rdquo;)
            </label>
            <input id="compensation" name="compensation" maxLength={120} placeholder="€400–600 / Negotiable" disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50" />

            <label htmlFor="apply_url" className="text-caption font-bold uppercase">External apply link (optional)</label>
            <input id="apply_url" name="apply_url" type="url" placeholder="https://…" disabled={!configured}
              className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue disabled:opacity-50" />
            <p className="text-caption uppercase opacity-70">
              Without a link, applicants reach you through Atelier chat
            </p>

            <button type="submit" disabled={!configured}
              className="self-start border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-red hover:border-red disabled:opacity-50">
              Post job
            </button>
          </form>
          )}
        </Window>

        <Window title="Your postings" accent="blue" span="col-span-12 md:col-span-7">
          {jobs.length === 0 ? (
            <p className="text-body opacity-70">No job posts yet.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {jobs.map((job) => (
                <li key={job.id} data-own-job={job.id} className="border-2 border-ink p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-h2 font-bold">{job.title}</p>
                    <span className={`border-2 border-ink px-2 py-0.5 text-caption font-bold uppercase ${job.status === "open" ? "bg-yellow" : "opacity-60"}`}>
                      {JOB_STATUS_LABEL[job.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-caption font-bold uppercase">
                    {DISCIPLINE_LABEL[job.discipline]} · {WORK_MODE_LABEL[job.work_mode]}
                    {job.location ? ` · ${job.location}` : ""} · {job.compensation}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {(["open", "filled", "closed"] as const)
                      .filter((s) => s !== job.status)
                      .map((s) => (
                        <form key={s} action={setJobStatus}>
                          <input type="hidden" name="id" value={job.id} />
                          <input type="hidden" name="status" value={s} />
                          <button disabled={!configured}
                            className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-ink hover:text-paper disabled:opacity-50">
                            Mark {JOB_STATUS_LABEL[s].toLowerCase()}
                          </button>
                        </form>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Window>
      </WindowGrid>
    </div>
  );
}
