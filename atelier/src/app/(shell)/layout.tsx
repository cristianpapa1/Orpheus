import Link from "next/link";
import { AppealBanner } from "@/components/AppealBanner";
import { Nav } from "@/components/Nav";
import { getActiveAppeal, getRaisedForAppeal } from "@/lib/donations/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const activeAppeal = await getActiveAppeal();
  const { getDismissedAppealId } = await import("@/app/appeal-actions");
  const dismissedId = await getDismissedAppealId();
  const appeal =
    activeAppeal && activeAppeal.id !== dismissedId ? activeAppeal : null;
  const raised = appeal ? await getRaisedForAppeal(appeal.id) : 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <Nav email={user?.email ?? null} />
      {appeal ? <AppealBanner appeal={appeal} raisedCents={raised} /> : null}
      {!isSupabaseConfigured() ? (
        <p
          data-setup-notice
          className="border-b-2 border-ink bg-yellow px-6 py-2 text-center text-caption font-bold uppercase"
        >
          Preview mode — add Supabase keys to .env.local to enable sign-in
        </p>
      ) : null}
      <main id="main" className="mx-auto w-full max-w-6xl grow px-6 py-10">
        {children}
      </main>
      <footer className="border-t-2 border-ink px-6 py-4 text-center text-caption uppercase">
        Atelier —{" "}
        <Link href="/donate" data-footer-donate className="border-b-2 border-ink font-bold hover:text-red">
          funded by donations
        </Link>
        , never by ads ·{" "}
        <Link href="/jobs" data-footer-jobs className="border-b-2 border-ink font-bold hover:text-blue">
          jobs for makers
        </Link>{" "}
        ·{" "}
        <Link href="/terms" data-footer-terms className="border-b-2 border-ink hover:text-blue">
          terms
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" data-footer-privacy className="border-b-2 border-ink hover:text-blue">
          privacy
        </Link>
      </footer>
    </div>
  );
}
