import { redirect } from "next/navigation";
import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { CreatorApplyForm } from "@/components/creator/CreatorApplyForm";
import { getViewerCreatorStatus } from "@/lib/profile/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Become a creator — Atelier" };

export default async function CreatorApplyPage() {
  if (!isSupabaseConfigured()) redirect("/feed");
  const status = await getViewerCreatorStatus();
  if (status === "approved") redirect("/feed");

  return (
    <div>
      <h1 className="mb-2 text-h1 font-bold uppercase">Become a creator</h1>
      <p className="mb-6 max-w-2xl text-body">
        Atelier is a space for people who make things. Anyone can browse, follow,
        and join groups — but posting work and starting groups is for creators.
        Tell us what you make and we&apos;ll review it by hand.
      </p>

      <WindowGrid>
        {status === "pending" ? (
          <Window title="Under review" accent="yellow" span="col-span-12 md:col-span-7">
            <p data-application-pending className="text-body">
              Your creator application is in review. We&apos;ll email you the
              moment you&apos;re approved — then the composer and group creation
              unlock. Meanwhile, make yourself at home: follow people, join
              groups, and set up your space.
            </p>
            <Link
              href="/feed"
              className="mt-4 inline-block border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
            >
              Back to the feed →
            </Link>
          </Window>
        ) : (
          <Window
            title={status === "rejected" ? "Apply again" : "Your application"}
            accent="blue"
            span="col-span-12 md:col-span-8"
          >
            {status === "rejected" ? (
              <p className="mb-4 border-2 border-ink bg-ink/5 p-3 text-body">
                A previous application wasn&apos;t approved. You&apos;re welcome to
                apply again with more detail or stronger links.
              </p>
            ) : null}
            <CreatorApplyForm />
          </Window>
        )}
      </WindowGrid>
    </div>
  );
}
