import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";

export const metadata = { title: "Privacy — Atelier" };

export default function PrivacyPage() {
  return (
    <div>
      <h1 className="mb-2 text-h1 font-bold uppercase">Privacy</h1>
      <p data-draft-notice className="mb-6 border-2 border-ink bg-yellow px-3 py-2 text-caption font-bold uppercase">
        Draft — for review by counsel before public launch
      </p>
      <WindowGrid>
        <Window title="What we store" accent="blue" span="col-span-12 md:col-span-6">
          <ul data-data-inventory className="flex flex-col gap-2 text-body">
            <li>Account: email, display name, handle, bio, links, layout, accent.</li>
            <li>Content: posts (images + originals), events, job posts, group memberships, follows.</li>
            <li>Messages: private 1:1 threads, readable only by their participants.</li>
            <li>Donations: amount, kind, and receipt email — card details never touch our servers (Stripe holds those).</li>
            <li>Safety: reports you file and blocks you set.</li>
          </ul>
        </Window>
        <Window title="What we don't do" accent="red" span="col-span-12 md:col-span-6">
          <ul className="flex flex-col gap-2 text-body">
            <li>No ad trackers, no third-party analytics scripts, no pixels.</li>
            <li>No selling or sharing of data — there is no advertiser to share it with.</li>
            <li>No engagement profiling. The feed is chronological; we don&apos;t need to know what holds your attention.</li>
          </ul>
          <p className="mt-4 text-body">
            <strong>Deletion:</strong> deleting your account removes your
            profile, posts, media, and messages. Requests:{" "}
            <a href="mailto:privacy@atelier.example" className="border-b-2 border-ink font-bold">
              privacy@atelier.example
            </a>
          </p>
        </Window>
      </WindowGrid>
    </div>
  );
}
