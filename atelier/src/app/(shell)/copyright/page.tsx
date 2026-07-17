import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { CopyrightNoticeForm } from "@/components/copyright/CopyrightNoticeForm";
import { copyrightAgent } from "@/lib/legal/config";

export const metadata = { title: "Copyright & takedown — Atelier" };

export default function CopyrightPage() {
  const agent = copyrightAgent();

  return (
    <div>
      <h1 className="mb-6 text-h1 font-bold uppercase">Copyright & takedown</h1>

      <WindowGrid>
        <Window title="Our commitment" accent="blue" span="col-span-12 md:col-span-6">
          <div className="flex flex-col gap-3 text-body">
            <p>
              Artists keep their copyright on Atelier (see the{" "}
              <Link href="/terms" className="border-b-2 border-ink font-bold hover:text-blue">
                Terms
              </Link>
              ). When someone posts work that isn&apos;t theirs, we act on a valid
              notice: we remove or disable access to the material, tell the person
              who posted it, and keep records.
            </p>
            <p>
              This process is how we respect the notice-and-takedown and safe-harbour
              rules — the DMCA (17 U.S.C. §512) in the US, and the e-Commerce
              Directive and DSM Directive in the EU.
            </p>
          </div>
        </Window>

        <Window title="Designated agent" accent="red" span="col-span-12 md:col-span-6">
          {agent.configured ? (
            <div className="flex flex-col gap-1 text-body">
              {agent.name ? <p className="font-bold">{agent.name}</p> : null}
              <p>
                Email:{" "}
                <a href={`mailto:${agent.email}`} className="border-b-2 border-ink font-bold">
                  {agent.email}
                </a>
              </p>
              {agent.address ? <p className="whitespace-pre-wrap">{agent.address}</p> : null}
              {agent.registrationId ? (
                <p data-dmca-registration className="mt-3 border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
                  Registered DMCA agent · U.S. Copyright Office ·{" "}
                  <span className="text-blue">{agent.registrationId}</span>
                </p>
              ) : (
                <p className="mt-3 border-2 border-ink bg-yellow px-3 py-2 text-caption font-bold uppercase">
                  Setup pending: register this agent with the U.S. Copyright Office
                  (dmca.copyright.gov) and set COPYRIGHT_AGENT_REGISTRATION.
                </p>
              )}
            </div>
          ) : (
            <p className="border-2 border-ink bg-yellow px-3 py-2 text-caption font-bold uppercase">
              Not configured. Set COPYRIGHT_AGENT_NAME / EMAIL / ADDRESS in the
              environment and register the agent with the U.S. Copyright Office
              before relying on the safe-harbour.
            </p>
          )}
        </Window>

        <Window title="What a valid notice needs" accent="yellow" span="col-span-12 md:col-span-6">
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-body">
            <li>Identify the copyrighted work you own.</li>
            <li>Identify the infringing material and where it is (the URL on Atelier).</li>
            <li>Your name, postal address, phone, and email.</li>
            <li>A statement of good-faith belief that the use isn&apos;t authorised.</li>
            <li>A statement, under penalty of perjury, that your notice is accurate and you&apos;re authorised to act.</li>
            <li>Your electronic signature (typing your name).</li>
          </ol>
        </Window>

        <Window title="Counter-notice & repeat infringers" accent="blue" span="col-span-12 md:col-span-6">
          <div className="flex flex-col gap-3 text-body">
            <p>
              <strong>Counter-notice:</strong> if your work was removed by mistake
              or misidentification, you can file a counter-notice below. We may
              restore the material unless the complainant pursues a court order.
            </p>
            <p>
              <strong>Repeat-infringer policy:</strong> we track infringement
              complaints per account. Repeat infringers are suspended, and on
              continued infringement their accounts are terminated.
            </p>
            <p className="text-caption uppercase opacity-70">
              Filing a false notice or counter-notice can carry legal liability.
            </p>
          </div>
        </Window>

        <Window title="File a notice" accent="red" span="col-span-12">
          <p className="mb-4 max-w-2xl text-body">
            Use this form to report infringement or to file a counter-notice.
            You don&apos;t need an Atelier account. Fields marked * are required.
          </p>
          <CopyrightNoticeForm />
        </Window>
      </WindowGrid>
    </div>
  );
}
