import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/profile/OnboardingForm";
import { getOnboardingState } from "@/lib/profile/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Set up your space — Atelier" };

export default async function OnboardingPage() {
  // Preview mode has no accounts to onboard.
  if (!isSupabaseConfigured()) redirect("/feed");

  const state = await getOnboardingState();
  if (!state) redirect("/login");
  // Never hard-loop: once onboarded, this page sends you home.
  if (state.onboarded) redirect("/feed");

  return (
    <main className="mx-auto w-full max-w-3xl grow px-6 py-12">
      <div className="mb-8">
        <div className="mb-4 flex gap-2" aria-hidden>
          <span className="size-6 bg-red" />
          <span className="size-6 bg-blue" />
          <span className="size-6 bg-yellow" />
        </div>
        <h1 className="text-display font-bold uppercase">Set up your space</h1>
        <p className="mt-4 max-w-xl text-body">
          A few things before you go in — your public name, your handle, and
          what you make. You can change all of this later in the editor.
        </p>
      </div>
      <div className="border-2 border-ink bg-paper p-6">
        <OnboardingForm
          initial={{
            display_name: state.display_name,
            handle: state.handle,
            account_type: state.account_type,
            institution_kind: state.institution_kind,
            interests: state.interests,
          }}
        />
      </div>
    </main>
  );
}
