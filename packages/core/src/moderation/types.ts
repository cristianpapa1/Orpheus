export const REPORT_SUBJECTS = [
  "post",
  "profile",
  "group",
  "message",
  "job",
] as const;
export type ReportSubject = (typeof REPORT_SUBJECTS)[number];

export const REPORT_REASONS = [
  "spam",
  "harassment",
  "stolen_work",
  "illegal",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REASON_LABEL: Record<ReportReason, string> = {
  spam: "Spam",
  harassment: "Harassment",
  stolen_work: "Stolen work",
  illegal: "Illegal content",
  other: "Something else",
};

export const REPORT_STATUSES = [
  "open",
  "reviewed",
  "dismissed",
  "actioned",
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface Report {
  id: string;
  reporter_handle: string;
  subject_type: ReportSubject;
  subject_id: string;
  reason: ReportReason;
  detail: string;
  status: ReportStatus;
  created_at: string;
}

/* Advisory rate-limit basics (per-user sliding windows, server-checked).
   Not a hard DDoS defense — that layer belongs to the host/CDN (LAUNCH.md). */
export const RATE_LIMITS = {
  posts_per_hour: 20,
  messages_per_hour: 120,
  reports_per_day: 20,
} as const;
