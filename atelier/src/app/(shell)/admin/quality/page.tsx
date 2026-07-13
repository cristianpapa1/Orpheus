import { notFound } from "next/navigation";
import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import {
  getQualityCandidates,
  getQualityStampedMembers,
} from "@/lib/profile/queries";
import { isViewerAdmin } from "@/lib/donations/queries";
import { grantQualityStamp, revokeQualityStamp } from "./actions";

export const metadata = { title: "Quality stamps — Atelier admin" };

const ERRORS: Record<string, string> = {
  forbidden: "You're not an admin.",
  service: "Service role not configured.",
  grant: "Couldn't grant the stamp.",
  revoke: "Couldn't revoke the stamp.",
  unavailable: "Preview mode.",
};

export default async function AdminQualityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; granted?: string; revoked?: string }>;
}) {
  if (!(await isViewerAdmin())) notFound();

  const { error, granted, revoked } = await searchParams;
  const [candidates, members] = await Promise.all([
    getQualityCandidates(),
    getQualityStampedMembers(),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-h1 font-bold uppercase">Quality stamps</h1>
      <p className="mb-6 max-w-2xl text-body">
        Members past 30 days with 5+ posts and 50+ mutual followers are eligible.
        Review the profile, then grant the stamp — they become a trusted reviewer
        who can flag low-quality work for you.
      </p>

      {error ? (
        <p role="alert" className="mb-4 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
          {ERRORS[error] ?? "Something went wrong."}
        </p>
      ) : null}
      {granted ? (
        <p role="status" className="mb-4 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
          Stamp granted.
        </p>
      ) : null}
      {revoked ? (
        <p role="status" className="mb-4 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
          Stamp revoked.
        </p>
      ) : null}

      <WindowGrid>
        <Window title={`Eligible (${candidates.length})`} accent="red" span="col-span-12">
          {candidates.length === 0 ? (
            <p className="text-body opacity-70">No one is eligible right now.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {candidates.map((c) => (
                <li
                  key={c.id}
                  data-candidate={c.id}
                  className="flex flex-wrap items-center gap-3 border-b-2 border-ink pb-3"
                >
                  <div className="min-w-0 grow">
                    <Link href={`/u/${c.handle || c.id}`} className="text-body font-bold hover:text-blue">
                      {c.display_name}
                      {c.handle ? ` · @${c.handle}` : ""}
                    </Link>
                    <p className="text-caption uppercase opacity-70">
                      {c.posts} posts · {c.mutuals} mutual followers · since{" "}
                      {c.onboarded_at.slice(0, 10)}
                    </p>
                  </div>
                  <Link
                    href={`/u/${c.handle || c.id}`}
                    target="_blank"
                    className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow"
                  >
                    Review
                  </Link>
                  <form action={grantQualityStamp}>
                    <input type="hidden" name="profile_id" value={c.id} />
                    <button
                      data-grant
                      className="border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
                    >
                      Grant stamp
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Window>

        {members.length > 0 ? (
          <Window title={`Quality members (${members.length})`} accent="yellow" span="col-span-12">
            <ul className="flex flex-col gap-2">
              {members.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-2">
                  <Link href={`/u/${m.handle || m.id}`} className="text-body font-bold hover:text-blue">
                    ✦ {m.display_name}
                    {m.handle ? ` · @${m.handle}` : ""}
                  </Link>
                  <form action={revokeQualityStamp}>
                    <input type="hidden" name="profile_id" value={m.id} />
                    <button className="border-2 border-red px-3 py-1 text-caption font-bold uppercase hover:bg-red hover:text-paper">
                      Revoke
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </Window>
        ) : null}
      </WindowGrid>
    </div>
  );
}
