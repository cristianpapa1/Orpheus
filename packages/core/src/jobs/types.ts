export const JOB_DISCIPLINES = [
  "art",
  "handmade",
  "photography",
  "music",
  "design",
  "other",
] as const;
export type JobDiscipline = (typeof JOB_DISCIPLINES)[number];

export const WORK_MODES = ["remote", "on_site", "hybrid"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const JOB_STATUSES = ["open", "filled", "closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export interface JobPost {
  id: string;
  profile_id: string;
  poster_handle: string;
  poster_name: string;
  title: string;
  discipline: JobDiscipline;
  description: string;
  location: string;
  work_mode: WorkMode;
  compensation: string;
  apply_url: string | null;
  status: JobStatus;
  created_at: string;
}

export const DISCIPLINE_LABEL: Record<JobDiscipline, string> = {
  art: "Art",
  handmade: "Handmade",
  photography: "Photography",
  music: "Music",
  design: "Design",
  other: "Other",
};

export const WORK_MODE_LABEL: Record<WorkMode, string> = {
  remote: "Remote",
  on_site: "On-site",
  hybrid: "Hybrid",
};

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  open: "Open",
  filled: "Filled",
  closed: "Closed",
};

export interface JobFilters {
  discipline?: string;
  mode?: string;
}

/** Pure discovery filter — invalid filter values mean "no filter". */
export function filterJobs(jobs: JobPost[], filters: JobFilters): JobPost[] {
  return jobs.filter((job) => {
    if (
      filters.discipline &&
      JOB_DISCIPLINES.includes(filters.discipline as JobDiscipline) &&
      job.discipline !== filters.discipline
    ) {
      return false;
    }
    if (
      filters.mode &&
      WORK_MODES.includes(filters.mode as WorkMode) &&
      job.work_mode !== filters.mode
    ) {
      return false;
    }
    return true;
  });
}
