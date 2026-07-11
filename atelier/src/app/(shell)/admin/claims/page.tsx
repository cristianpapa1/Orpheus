import { notFound } from "next/navigation";
import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getPendingClaims, getResolvedClaims } from "@/lib/profile/queries";
import { isViewerAdmin } from "@/lib/donations/queries";
import { resolveClaim, revokeClaim } from "./actions";

export const metadata = { title: "Profile claims — Atelier admin" };

const ERRORS: Record<string, string> = {
  forbidden: "You're not an admin.",
  resolve: "Couldn't update the claim.",
  assign: "Couldn't assign the profile.",
  revoke: "Couldn't revoke the claim.",
  service: "Service role not configured.",
  unavailable: "Preview mode — claims need Supabase configured.",
};

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; resolved?: string; revoked?: string }>;
}) {
  // Non-admins get a 404 — the page's existence isn't leaked.
  if (!(await isViewerAdmin())) notFound();

  const { error, resolved, revoked } = await searchParams;
  const [claims, history] = await Promise.all([
    getPendingClaims(),
    getResolvedClaims(),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-h1 font-bold uppercase">Profile claims</h1>
      <p className="mb-6 max-w-2xl text-body">
        Community institution profiles a real owner has asked to claim.
        Approving hands them the profile (they manage it; it keeps its handle,
        posts, and groups). Verify the requester before approving.
      </p>

      {error ? (
        <p role="alert" className="mb-4 border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
          {ERRORS[error] ?? "Something went wrong."}
        </p>
      ) : null}
      {resolved ? (
        <p role="status" className="mb-4 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
          Claim resolved.
        </p>
      ) : null}
      {revoked ? (
        <p role="status" className="mb-4 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
          Claim revoked — profile handed back.
        </p>
      ) : null}

      {claims.length === 0 ? (
        <WindowGrid>
          <Window title="Empty" accent="blue" span="col-span-12 md:col-span-6">
            <p className="text-body">No pending claims.</p>
          </Window>
        </WindowGrid>
      ) : (
        <WindowGrid>
          {claims.map((c, i) => (
            <div
              key={`${c.profile_id}-${c.claimant_id}`}
              data-claim
              className="col-span-12 flex flex-col md:col-span-6"
            >
              <Window
                title={`Claim on @${c.profile_handle}`}
                accent={(["red", "blue", "yellow"] as const)[i % 3]}
                className="h-full"
              >
                <p className="text-body">
                  <Link href={`/u/${c.profile_handle}`} className="font-bold hover:text-blue">
                    {c.profile_name}
                  </Link>{" "}
                  requested by{" "}
                  <Link href={`/u/${c.claimant_handle || c.claimant_id}`} className="font-bold hover:text-blue">
                    {c.claimant_name}
                    {c.claimant_handle ? ` · @${c.claimant_handle}` : ""}
                  </Link>
                </p>
                {c.message ? (
                  <p className="mt-3 border-2 border-ink bg-ink/5 p-3 text-body">
                    {c.message}
                  </p>
                ) : (
                  <p className="mt-3 text-caption uppercase opacity-70">
                    No verification message provided.
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={resolveClaim}>
                    <input type="hidden" name="profile_id" value={c.profile_id} />
                    <input type="hidden" name="claimant_id" value={c.claimant_id} />
                    <input type="hidden" name="decision" value="approve" />
                    <button className="border-2 border-ink bg-ink px-4 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
                      Approve
                    </button>
                  </form>
                  <form action={resolveClaim}>
                    <input type="hidden" name="profile_id" value={c.profile_id} />
                    <input type="hidden" name="claimant_id" value={c.claimant_id} />
                    <input type="hidden" name="decision" value="reject" />
                    <button className="border-2 border-ink px-4 py-1 text-caption font-bold uppercase hover:bg-red hover:border-red hover:text-paper">
                      Reject
                    </button>
                  </form>
                </div>
              </Window>
            </div>
          ))}
        </WindowGrid>
      )}

      {history.length > 0 ? (
        <section data-claim-history className="mt-8">
          <h2 className="mb-4 text-h2 font-bold uppercase">History</h2>
          <WindowGrid>
            <Window title={`Resolved (${history.length})`} accent="blue" span="col-span-12">
              <ul className="flex flex-col gap-3">
                {history.map((c) => (
                  <li
                    key={`${c.profile_id}-${c.claimant_id}`}
                    data-claim-history-row
                    className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-3"
                  >
                    <span className="text-body">
                      <Link href={`/u/${c.profile_handle}`} className="font-bold hover:text-blue">
                        @{c.profile_handle}
                      </Link>{" "}
                      → {c.claimant_name}
                      {c.claimant_handle ? ` (@${c.claimant_handle})` : ""}{" "}
                      <span
                        data-claim-status={c.status}
                        className={`ml-1 border-2 border-ink px-2 py-0.5 text-caption font-bold uppercase ${
                          c.status === "approved" ? "bg-ink text-paper" : ""
                        }`}
                      >
                        {c.status}
                      </span>
                      {c.resolved_at ? (
                        <span className="ml-2 text-caption uppercase opacity-60">
                          {c.resolved_at.slice(0, 10)}
                        </span>
                      ) : null}
                    </span>
                    {c.status === "approved" ? (
                      <form action={revokeClaim}>
                        <input type="hidden" name="profile_id" value={c.profile_id} />
                        <input type="hidden" name="claimant_id" value={c.claimant_id} />
                        <button
                          data-revoke-claim
                          className="border-2 border-red px-3 py-1 text-caption font-bold uppercase hover:bg-red hover:text-paper"
                        >
                          Revoke
                        </button>
                      </form>
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
