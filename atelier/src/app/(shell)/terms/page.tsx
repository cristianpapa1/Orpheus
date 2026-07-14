import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";

export const metadata = { title: "Terms — Atelier" };

export default function TermsPage() {
  return (
    <div>
      <h1 className="mb-2 text-h1 font-bold uppercase">Terms of use</h1>
      <p data-draft-notice className="mb-6 border-2 border-ink bg-yellow px-3 py-2 text-caption font-bold uppercase">
        Draft — for review by counsel before public launch
      </p>
      <WindowGrid>
        <Window title="The deal" accent="blue" span="col-span-12 md:col-span-6">
          <ul className="flex flex-col gap-3 text-body">
            <li>Your work stays yours. Posting here grants Atelier only the license needed to display it to the people you share it with.</li>
            <li>Atelier is funded by voluntary donations. There are no ads, no promoted placement, and no marketplace — nothing you can buy changes what anyone sees.</li>
            <li>You must be legally able to share what you post. Stolen or infringing work is removed and repeat infringement closes accounts.</li>
            <li>Harassment, spam, and illegal content are grounds for removal. Reports are reviewed by human moderators.</li>
            <li>We can suspend accounts that break these rules; you can export and delete your data at any time.</li>
          </ul>
        </Window>
        <Window title="Liability" accent="red" span="col-span-12 md:col-span-6">
          <p className="text-body">
            Atelier is operated by À un flâneur, provided as-is by a small team. We work to keep it up
            and safe, but we cannot warrant uninterrupted service. External
            links (tickets, job applications) lead to services we don&apos;t
            control.
          </p>
        </Window>
      </WindowGrid>
    </div>
  );
}
