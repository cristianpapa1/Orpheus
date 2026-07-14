import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { getOwnProfile } from "@/lib/profile/queries";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Settings — Atelier" };

export default async function ProfileSettingsPage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold uppercase">Settings</h1>

      <WindowGrid>
        <Window title="Manage your space" accent="blue" span="col-span-12 md:col-span-8">
          <ul className="flex flex-col gap-3">
            <li>
              <Link href="/profile/edit" className="border-b-2 border-ink text-body font-bold hover:text-blue">
                Layout &amp; identity editor →
              </Link>
            </li>
            <li>
              <Link href="/profile/events" className="border-b-2 border-ink text-body font-bold hover:text-blue">
                Your events →
              </Link>
            </li>
            <li>
              <Link href="/profile/jobs" className="border-b-2 border-ink text-body font-bold hover:text-blue">
                Your job posts →
              </Link>
            </li>
          </ul>
        </Window>
      </WindowGrid>
    </div>
  );
}
