import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getManagedProfiles, getOwnProfile } from "@/lib/profile/queries";
import { isViewerAdmin } from "@/lib/donations/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function ProfilePage() {
  const profile = await getOwnProfile();
  const managed = await getManagedProfiles();
  const isAdmin = await isViewerAdmin();
  const configured = isSupabaseConfigured();

  return (
    <WindowGrid>
      <Window title="Your space" accent="yellow" span="col-span-12 md:col-span-7">
        <p className="text-h2 font-bold uppercase">
          {profile ? profile.display_name : "Build your own space."}
        </p>
        {profile?.handle ? (
          <p className="mt-1 text-caption font-bold uppercase">
            @{profile.handle}
          </p>
        ) : null}
        <p className="mt-4 max-w-md text-body">
          {profile?.bio ||
            "Your profile is yours to construct — arrange, resize, and reorder your windows."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/profile/edit"
            className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
          >
            Open the editor
          </Link>
          <Link
            href="/profile/events"
            data-manage-events
            className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
          >
            Manage events
          </Link>
          <Link
            href="/profile/jobs"
            data-manage-jobs
            className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
          >
            Manage job posts
          </Link>
          <Link
            href="/profile/settings"
            data-profile-settings
            className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
          >
            Settings
          </Link>
          {profile?.handle ? (
            <Link
              href={`/u/${profile.handle}`}
              className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
            >
              View public page → /u/{profile.handle}
            </Link>
          ) : null}
        </div>
      </Window>
      {managed.length > 0 ? (
        <Window title="Spaces you manage" accent="blue" span="col-span-12 md:col-span-5">
          <p className="text-body">
            Institution profiles you&apos;ve claimed. They keep their own handle,
            posts, and groups — you just steer them.
          </p>
          <ul data-managed-spaces className="mt-4 flex flex-col gap-2">
            {managed.map((m) => (
              <li key={m.id} className="flex items-baseline justify-between gap-2">
                <Link href={`/u/${m.handle || m.id}`} className="text-body font-bold hover:text-blue">
                  {m.display_name}
                  {m.handle ? ` · @${m.handle}` : ""}
                </Link>
                <Link
                  href={`/profile/edit?as=${m.handle}`}
                  className="border-2 border-ink px-2 py-0.5 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </Window>
      ) : null}

      {isAdmin ? (
        <Window title="Admin" accent="red" span="col-span-12 md:col-span-5">
          <p className="text-body">Review requests to claim community profiles.</p>
          <Link
            href="/admin/claims"
            className="mt-4 inline-block border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-red hover:border-red"
          >
            Profile claims →
          </Link>
        </Window>
      ) : null}

      <Window title="Sharing" accent="red" span="col-span-12 md:col-span-5">
        <p className="text-body">
          Your space lives at a public URL anyone can open — server-rendered,
          fast, and arranged exactly how you saved it.
        </p>
        {!configured ? (
          <p className="mt-3 text-caption font-bold uppercase">
            Preview mode: edits save to this browser. Try the demo spaces —{" "}
            <Link href="/u/ines" className="border-b-2 border-ink hover:text-blue">
              /u/ines
            </Link>{" "}
            ·{" "}
            <Link href="/u/theo" className="border-b-2 border-ink hover:text-blue">
              /u/theo
            </Link>
          </p>
        ) : null}
      </Window>
    </WindowGrid>
  );
}
