import { createReport } from "@/lib/moderation/actions";
import {
  REASON_LABEL,
  REPORT_REASONS,
  type ReportSubject,
} from "@/lib/moderation/types";

/**
 * Report disclosure — server-rendered <details>, never a modal.
 * Renders only when Supabase is configured (callers gate it).
 */
export function ReportControl({
  subjectType,
  subjectId,
  backTo,
}: {
  subjectType: ReportSubject;
  subjectId: string;
  backTo: string;
}) {
  return (
    <details data-report-control className="inline-block">
      <summary className="cursor-pointer border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow">
        Report
      </summary>
      <form
        action={createReport}
        className="mt-2 flex w-72 flex-col gap-2 border-2 border-ink bg-paper p-3"
      >
        <input type="hidden" name="subject_type" value={subjectType} />
        <input type="hidden" name="subject_id" value={subjectId} />
        <input type="hidden" name="back_to" value={backTo} />
        <label htmlFor={`reason-${subjectId}`} className="text-caption font-bold uppercase">
          Reason
        </label>
        <select
          id={`reason-${subjectId}`}
          name="reason"
          required
          defaultValue=""
          className="border-2 border-ink bg-paper px-2 py-1 text-body outline-none focus:border-blue"
        >
          <option value="" disabled>
            Pick one…
          </option>
          {REPORT_REASONS.map((r) => (
            <option key={r} value={r}>
              {REASON_LABEL[r]}
            </option>
          ))}
        </select>
        <textarea
          name="detail"
          rows={2}
          maxLength={600}
          placeholder="Anything the moderators should know (optional)"
          className="border-2 border-ink bg-paper px-2 py-1 text-body outline-none focus:border-blue"
        />
        <button
          type="submit"
          className="self-start border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-red hover:border-red"
        >
          Send report
        </button>
      </form>
    </details>
  );
}
