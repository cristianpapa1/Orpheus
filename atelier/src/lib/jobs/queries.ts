import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_JOBS } from "./demo";
import {
  filterJobs,
  type JobFilters,
  type JobPost,
} from "./types";

/* Job reads. Discovery is chronological (created_at desc) — never ranked. */

const JOB_SELECT =
  "id, profile_id, title, discipline, description, location, work_mode, compensation, apply_url, status, created_at, poster:profiles(handle, display_name)";

type JobRow = Omit<JobPost, "poster_handle" | "poster_name"> & {
  poster: { handle: string | null; display_name: string | null } | null;
};

function toJob(row: JobRow): JobPost {
  return {
    ...row,
    poster_handle: row.poster?.handle ?? "",
    poster_name: row.poster?.display_name ?? row.poster?.handle ?? "Unnamed",
  };
}

const byNewest = (a: JobPost, b: JobPost) =>
  b.created_at.localeCompare(a.created_at);

/** Open jobs for discovery, filtered and newest-first. */
export async function getOpenJobs(
  filters: JobFilters,
  limit = 50,
): Promise<JobPost[]> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return filterJobs(
      DEMO_JOBS.filter((j) => j.status === "open"),
      filters,
    )
      .sort(byNewest)
      .slice(0, limit);
  }

  let query = supabase
    .from("job_posts")
    .select(JOB_SELECT)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (filters.discipline) query = query.eq("discipline", filters.discipline);
  if (filters.mode) query = query.eq("work_mode", filters.mode);

  const { data } = await query;
  return ((data ?? []) as unknown as JobRow[]).map(toJob);
}

/** All of a profile's job posts (open + filled/closed for the collapse). */
export async function getJobsByProfile(profileId: string): Promise<JobPost[]> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return DEMO_JOBS.filter((j) => j.profile_id === profileId).sort(byNewest);
  }
  const { data } = await supabase
    .from("job_posts")
    .select(JOB_SELECT)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as JobRow[]).map(toJob);
}

export async function getOwnJobs(): Promise<JobPost[]> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    // Preview: show Inês's demo jobs so the manager is explorable.
    return DEMO_JOBS.filter(
      (j) => j.profile_id === "00000000-0000-4000-a000-000000000001",
    ).sort(byNewest);
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return getJobsByProfile(user.id);
}
