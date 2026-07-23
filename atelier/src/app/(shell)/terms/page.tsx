import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { TERMS_VERSION } from "@/lib/legal/config";

export const metadata = { title: "Terms — Atelier" };

export default function TermsPage() {
  return (
    <div>
      <h1 className="mb-2 text-h1 font-bold uppercase">Terms of use</h1>
      <p className="mb-6 text-caption uppercase opacity-70">
        Version {TERMS_VERSION}
      </p>

      <WindowGrid>
        <Window title="You keep your copyright" accent="blue" span="col-span-12 md:col-span-6">
          <div className="flex flex-col gap-3 text-body">
            <p>
              Everything you make and post stays <strong>yours</strong>. You keep
              all copyright and moral rights in your work. Atelier claims no
              ownership of anything you upload — not your images, writing, audio,
              video, or any other work.
            </p>
            <p>
              We never sell your work, and we never license it to third parties
              for their own use.
            </p>
          </div>
        </Window>

        <Window title="The licence you grant us" accent="red" span="col-span-12 md:col-span-6">
          <div className="flex flex-col gap-3 text-body">
            <p>
              To actually run the service — to store your work, show it in the
              feed, on your profile, and to the people you share it with — you
              give us permission to do so. Specifically, you grant À un flâneur a{" "}
              <strong>non-exclusive, worldwide, royalty-free licence</strong> to
              host, store, reproduce, display, and distribute the work you post,{" "}
              <strong>solely to operate, promote, and improve the service</strong>.
            </p>
            <p>
              This licence includes the right to make technical copies (thumbnails,
              format conversions, backups) and to sub-license these rights only to
              the providers who help us run Atelier (e.g. our hosting and storage
              providers), and only for that purpose.
            </p>
            <p>
              The licence ends when you delete the work or your account, except for
              copies already shared onward by others and reasonable backups that
              age out of our systems. This is the same host-to-operate model used
              by Behance and Instagram — a licence, never a transfer of ownership.
            </p>
          </div>
        </Window>

        <Window title="What you may post" accent="yellow" span="col-span-12 md:col-span-6">
          <ul className="flex flex-col gap-2 text-body">
            <li>You must own the work you post, or have the rights and permissions to share it.</li>
            <li>Don&apos;t post work that isn&apos;t yours, or that infringes anyone&apos;s copyright, trademark, or other rights.</li>
            <li>Get releases where you need them (e.g. recognisable people, other people&apos;s art in your frame).</li>
            <li>No harassment, spam, or illegal content. Human moderators review reports.</li>
          </ul>
        </Window>

        <Window title="Copyright complaints & takedown" accent="blue" span="col-span-12 md:col-span-6">
          <div className="flex flex-col gap-3 text-body">
            <p>
              If you believe work here infringes your copyright, tell us and
              we&apos;ll act. We run a formal{" "}
              <Link href="/copyright" className="border-b-2 border-ink font-bold hover:text-blue">
                notice-and-takedown process
              </Link>{" "}
              with a designated agent (DMCA in the US; the e-Commerce and DSM rules
              in the EU), including a counter-notice route for good-faith disputes.
            </p>
            <p>
              <strong>Repeat infringers:</strong> accounts that repeatedly post
              infringing work will be suspended and, on continued infringement,
              terminated.
            </p>
          </div>
        </Window>

        <Window title="AI & machine learning" accent="red" span="col-span-12 md:col-span-6">
          <div className="flex flex-col gap-3 text-body">
            <p>
              We do not license or sell the work you post for training third-party
              AI or machine-learning models.
            </p>
            <p>
              You and Atelier expressly <strong>reserve all rights</strong> against
              text-and-data mining, scraping, and AI-training use of the work here,
              including the reservation permitted under Article 4 of the EU DSM
              Directive (2019/790). We publish machine-readable opt-out signals
              (robots directives, an <code>ai.txt</code> file, and{" "}
              <code>noai</code>/<code>noimageai</code> headers).
            </p>
            <p>
              Automated crawling, scraping, or bulk collection of content or data
              from Atelier without our written permission is not allowed.
            </p>
          </div>
        </Window>

        <Window title="How Atelier is funded" accent="yellow" span="col-span-12 md:col-span-6">
          <ul className="flex flex-col gap-2 text-body">
            <li>Funded by voluntary donations — no ads, no promoted placement, no pay-to-be-seen.</li>
            <li>Nothing you can buy changes what anyone sees. The feed is chronological.</li>
            <li>We may suspend accounts that break these rules; you can export and delete your data at any time.</li>
          </ul>
        </Window>

        <Window title="Liability" accent="blue" span="col-span-12 md:col-span-6">
          <p className="text-body">
            Atelier is operated by À un flâneur and provided <strong>as-is</strong>{" "}
            by a small team. We work to keep it up and safe, but we cannot warrant
            uninterrupted service, and to the extent the law allows we are not
            liable for indirect or consequential loss. External links (tickets,
            job applications, shops) lead to services we don&apos;t control.
          </p>
        </Window>

        <Window title="Changes to these terms" accent="red" span="col-span-12 md:col-span-6">
          <p className="text-body">
            We may update these terms; material changes will be posted here with a
            new version date. Continuing to use Atelier after a change means you
            accept the updated terms. Questions:{" "}
            <Link href="/copyright" className="border-b-2 border-ink font-bold hover:text-blue">
              copyright & legal contacts
            </Link>
            .
          </p>
        </Window>
      </WindowGrid>
    </div>
  );
}
