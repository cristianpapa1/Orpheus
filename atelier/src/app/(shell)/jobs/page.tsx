import Link from "next/link";
import { JobCard } from "@/components/jobs/JobCard";
import { Window, type WindowAccent } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getOpenJobs } from "@/lib/jobs/queries";
import { getFollowing } from "@/lib/profile/queries";
import {
  DISCIPLINE_LABEL,
  JOB_DISCIPLINES,
  WORK_MODES,
  WORK_MODE_LABEL,
} from "@atelier/core/jobs/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Jobs — Atelier" };

const ACCENTS: WindowAccent[] = ["red", "blue", "yellow"];

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ discipline?: string; mode?: string; following?: string }>;
}) {
  const { discipline, mode, following: followingParam } = await searchParams;
  const following = followingParam === "1";
  const follows = following ? await getFollowing() : [];
  const jobs = await getOpenJobs(
    { discipline, mode },
    50,
    following ? follows.map((f) => f.id) : null,
  );
  const canChat = isSupabaseConfigured();
  const { t: dict } = await getI18n();
  const t = dict.jobs;

  const scopeHref = (f: boolean) => {
    const p = new URLSearchParams();
    if (f) p.set("following", "1");
    if (discipline) p.set("discipline", discipline);
    if (mode) p.set("mode", mode);
    const s = p.toString();
    return s ? `/jobs?${s}` : "/jobs";
  };

  return (
    <div>
      <h1 className="mb-2 text-h1 font-bold uppercase">{t.title}</h1>
      <p className="mb-4 max-w-2xl text-body">
        {following ? t.introFollowing : t.introAll}
      </p>

      <div data-scope-toggle className="mb-6 flex flex-wrap gap-2">
        <Link href={scopeHref(true)} aria-current={following}
          className={`border-2 border-ink px-4 py-2 text-caption font-bold uppercase ${following ? "bg-ink text-paper" : "hover:bg-yellow"}`}>
          {t.peopleYouFollow}
        </Link>
        <Link href={scopeHref(false)} aria-current={!following}
          className={`border-2 border-ink px-4 py-2 text-caption font-bold uppercase ${!following ? "bg-ink text-paper" : "hover:bg-yellow"}`}>
          {t.everyone}
        </Link>
      </div>

      {/* GET-form filters: SSR-friendly, shareable URLs */}
      <form data-job-filters method="get" className="mb-6 flex flex-wrap items-end gap-3">
        {following ? <input type="hidden" name="following" value="1" /> : null}
        <label className="flex flex-col gap-1 text-caption font-bold uppercase">
          {t.discipline}
          <select name="discipline" defaultValue={discipline ?? ""}
            className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue">
            <option value="">{t.all}</option>
            {JOB_DISCIPLINES.map((d) => (
              <option key={d} value={d}>{DISCIPLINE_LABEL[d]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-caption font-bold uppercase">
          {t.workMode}
          <select name="mode" defaultValue={mode ?? ""}
            className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue">
            <option value="">{t.all}</option>
            {WORK_MODES.map((m) => (
              <option key={m} value={m}>{WORK_MODE_LABEL[m]}</option>
            ))}
          </select>
        </label>
        <button type="submit"
          className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
          {t.filter}
        </button>
      </form>

      {jobs.length === 0 ? (
        <WindowGrid>
          <Window title={t.noMatches} accent="yellow" span="col-span-12 md:col-span-6">
            <p className="text-body">
              {following
                ? follows.length === 0
                  ? t.noMatchesFollowingNone
                  : t.noMatchesFollowingSome
                : t.noMatchesAll}
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
