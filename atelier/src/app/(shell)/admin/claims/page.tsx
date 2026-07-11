import { notFound } from "next/navigation";
import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getPendingClaims } from "@/lib/profile/queries";
import { isViewerAdmin } from "@/lib/donations/queries";
import { resolveClaim } from "./actions";

export const metadata = { title: "Profile claims — Atelier admin" };

const ERRORS: Record<string, string> = {
  forbidden: "You're not an admin.",
  resolve: "Couldn't update the claim.",
  assign: "Couldn't assign the profile.",
  service: "Service role not configured.",
  unavailable: "Preview mode — claims need Supabase configured.",
};

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; resolved?: string }>;
}) {
  // Non-admins get a 404 — the page's existence isn't leaked.
  if (!(await isViewerAdmin())) notFound();

  const { error, resolved } = await searchParams;
  const claims = await getPendingClaims();

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
    </div>
  );
}
