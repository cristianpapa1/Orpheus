import { ImportPanel } from "@/components/ImportPanel";
import type { InstitutionValidation } from "@/lib/validation";

/**
 * The store-setup notice for automatic catalog import. It always tells the
 * seller where they stand — validated, pending, or not yet claimed — so when
 * they reach the store-creation phase they know *why* automatic import is
 * (un)available and *what* is pending. Only a validated institution with an
 * open store sees the working importer; everyone else sees the path to unlock
 * it, and can still add products by hand.
 */
export function ImportNotice({
  validation,
  hasStore,
}: {
  validation: InstitutionValidation;
  hasStore: boolean;
}) {
  const { status, institutions, pending, ctaUrl } = validation;

  if (status === "validated") {
    const name = institutions[0]?.display_name ?? "your institution";
    if (hasStore) {
      // Store is open + validated → automatic import is live.
      return (
        <div className="mt-10">
          <p className="mb-2 border-2 border-ink bg-yellow px-3 py-2 text-caption font-bold uppercase">
            ✓ Validated as {name} — automatic import unlocked
          </p>
          <ImportPanel />
        </div>
      );
    }
    // Validated, but no store yet — reassure them it's waiting.
    return (
      <div className="mt-6 border-2 border-ink bg-yellow px-4 py-3">
        <p className="text-caption font-bold uppercase">✓ Validated — {name}</p>
        <p className="mt-1 text-body">
          You&apos;re validated as {name}. Once your store is open, you can import
          your existing catalog automatically.
        </p>
      </div>
    );
  }

  // Locked: spell out why and what is pending.
  const isPending = status === "pending";
  const pendingName = pending[0]?.display_name ?? "your institution";

  return (
    <section className="mt-10 border-2 border-ink">
      <div className="border-b-2 border-ink px-4 py-3">
        <h2 className="flex items-center gap-2 text-h2 font-bold uppercase opacity-60">
          Import from your shop
          <span aria-hidden>🔒</span>
        </h2>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-caption font-bold uppercase">
          {isPending
            ? "Automatic import — pending validation"
            : "Automatic import — validation required"}
        </p>

        {isPending ? (
          <p className="text-body">
            Automatic import brings your existing catalog in for you — but it runs
            only for the validated institution behind a shop. Your claim to{" "}
            <strong>{pendingName}</strong> is under review. As soon as an admin
            validates you on Atelier, automatic import unlocks right here.
          </p>
        ) : (
          <p className="text-body">
            Automatic import brings your existing catalog in for you — but it runs
            only for validated institutions, so only the real owner of a shop can
            import it. Find your institution on Atelier and claim it; once an
            admin validates you, automatic import appears here.
          </p>
        )}

        <p className="text-body opacity-70">
          This only gates the automatic import — you can still add products by
          hand anytime.
        </p>

        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={
            isPending
              ? "self-start border-2 border-ink px-6 py-2 text-caption font-bold uppercase hover:bg-yellow"
              : "self-start border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:border-blue hover:bg-blue"
          }
        >
          {isPending
            ? "Check your claim on Atelier →"
            : "Claim your institution on Atelier →"}
        </a>
      </div>
    </section>
  );
}
