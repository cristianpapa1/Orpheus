import { JobCard } from "@/components/jobs/JobCard";
import { Window, type WindowAccent } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getOpenJobs } from "@/lib/jobs/queries";
import {
  DISCIPLINE_LABEL,
  JOB_DISCIPLINES,
  WORK_MODES,
  WORK_MODE_LABEL,
} from "@atelier/core/jobs/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Jobs — Atelier" };

const ACCENTS: WindowAccent[] = ["red", "blue", "yellow"];

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ discipline?: string; mode?: string }>;
}) {
  const { discipline, mode } = await searchParams;
  const jobs = await getOpenJobs({ discipline, mode });
  const canChat = isSupabaseConfigured();

  return (
    <div>
      <h1 className="mb-2 text-h1 font-bold uppercase">Jobs</h1>
      <p className="mb-6 max-w-2xl text-body">
        Paid work for makers, posted by makers. Newest first, always — nothing
        here can be promoted.
      </p>

      {/* GET-form filters: SSR-friendly, shareable URLs */}
      <form data-job-filters method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-caption font-bold uppercase">
          Discipline
          <select name="discipline" defaultValue={discipline ?? ""}
            className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue">
            <option value="">All</option>
            {JOB_DISCIPLINES.map((d) => (
              <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-caption font-bold uppercase">
          Work mode
          <select name="mode" defaultValue={mode ?? ""}
            className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue">
            <option value="">All</option>
            {WORK_MODES.map((m) => (
              <option key={m} value={m}>{WORK_MODE_LABEL[m]}</option>
            ))}
          </select>
        </label>
        <button type="submit"
          className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
          Filter
        </button>
      </form>

      {jobs.length === 0 ? (
        <WindowGrid>
          <Window title="No matches" accent="yellow" span="col-span-12 md:col-span-6">
            <p className="text-body">
              No open postings match those filters. Widen the search — or post
              one from your profile.
            </p>
          </Window>
        </WindowGrid>
      ) : (
        <WindowGrid>
          {jobs.map((job, i) => (
            <JobCard key={job.id} job={job} accent={ACCENTS[i % 3]} canChat={canChat} />
          ))}
        </WindowGrid>
      )}
    </div>
  );
}
