import Link from "next/link";
import { MessageButton } from "@/components/chat/MessageButton";
import { Window, type WindowAccent } from "@/components/ui/Window";
import {
  DISCIPLINE_LABEL,
  WORK_MODE_LABEL,
  type JobPost,
} from "@atelier/core/jobs/types";

/** A job post as a window — used in discovery. */
export function JobCard({
  job,
  accent,
  canChat,
}: {
  job: JobPost;
  accent: WindowAccent;
  canChat: boolean;
}) {
  return (
    <div data-job={job.id} className="col-span-12 flex flex-col md:col-span-6">
      <Window title={DISCIPLINE_LABEL[job.discipline]} accent={accent} className="h-full">
        <p className="text-h2 font-bold">{job.title}</p>
        <p className="mt-1 text-caption font-bold uppercase">
          {WORK_MODE_LABEL[job.work_mode]}
          {job.location ? ` · ${job.location}` : ""} ·{" "}
          <span data-compensation>{job.compensation}</span>
        </p>
        {job.description ? (
          <p className="mt-3 text-body">{job.description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href={`/u/${job.poster_handle}`}
            className="text-caption font-bold uppercase hover:text-blue"
          >
            {job.poster_name} · @{job.poster_handle}
          </Link>
          <span className="ml-auto flex gap-2">
            {canChat ? (
              <MessageButton
                targetHandle={job.poster_handle}
                label="Apply via chat"
              />
            ) : null}
            {job.apply_url ? (
              <a
                data-apply-link
                href={job.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
              >
                Apply ↗
              </a>
            ) : null}
          </span>
        </div>
      </Window>
    </div>
  );
}
