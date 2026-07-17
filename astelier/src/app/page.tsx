import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { Nav } from "@/components/Nav";
import { getGateState, REQUIRED_FOLLOWS } from "@/lib/gate";
import { getI18n } from "@/lib/i18n/server";

const ATELIER_URL = "https://atelier.aunflaneur.com";

export default async function AstelierHome() {
  const gate = await getGateState();
  const pct = Math.min(100, Math.round((gate.followCount / REQUIRED_FOLLOWS) * 100));
  const { t: dict } = await getI18n();
  const t = dict.home;
  const n = String(REQUIRED_FOLLOWS);

  return (
    <>
      <Nav signedIn={gate.signedIn} />
      <main id="main" className="mx-auto w-full max-w-6xl grow px-6 py-12">
        <section className="mb-10">
          <h1 className="text-display font-bold uppercase leading-none">{t.heroTitle}</h1>
          <p className="mt-6 max-w-md text-body">{t.heroLead}</p>
        </section>

        {!gate.signedIn ? (
          <WindowGrid>
            <Window title={t.enter} accent="blue" span="col-span-12 md:col-span-7">
              <p className="text-body">{t.enterBody}</p>
              <Link
                href="/login"
                className="mt-6 inline-block border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
              >
                {t.signIn}
              </Link>
            </Window>
            <Window title={t.howItWorks} accent="yellow" span="col-span-12 md:col-span-5">
              <p className="text-body">{t.howBody.replace("{n}", n)}</p>
            </Window>
          </WindowGrid>
        ) : gate.unlocked ? (
          <WindowGrid>
            <Window
              title={gate.displayName ? `${t.welcome}, ${gate.displayName}` : t.welcome}
              accent="red"
              span="col-span-12 md:col-span-7"
            >
              <p className="text-body">{t.inBody}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/sell"
                  className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
                >
                  {t.openStore}
                </Link>
                <Link
                  href="/browse"
                  className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase hover:bg-yellow"
                >
                  {t.browseMakers}
                </Link>
              </div>
            </Window>
            <Window title={t.access} accent="blue" span="col-span-12 md:col-span-5">
              <p className="text-body font-bold uppercase">{t.unlocked}</p>
              <p className="mt-2 text-body">
                {gate.followCount} {t.makersFollowed}
              </p>
            </Window>
          </WindowGrid>
        ) : (
          <WindowGrid>
            <Window title={t.almostIn} accent="yellow" span="col-span-12 md:col-span-7">
              <p className="text-body">{t.almostBody.replace("{n}", n)}</p>
              <div className="mt-6">
                <div className="flex justify-between text-caption font-bold uppercase">
                  <span>
                    {gate.followCount} / {REQUIRED_FOLLOWS}
                  </span>
                  <span>{gate.remaining} {t.toGo}</span>
                </div>
                <div
                  className="mt-2 h-4 border-2 border-ink"
                  role="progressbar"
                  aria-valuenow={gate.followCount}
                  aria-valuemin={0}
                  aria-valuemax={REQUIRED_FOLLOWS}
                >
                  <div className="h-full bg-blue" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <a
                href={`${ATELIER_URL}/search`}
                className="mt-6 inline-block border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
              >
                {t.findMakers}
              </a>
            </Window>
            <Window title={t.whyFifteen} accent="blue" span="col-span-12 md:col-span-5">
              <p className="text-body">{t.whyBody}</p>
            </Window>
          </WindowGrid>
        )}
      </main>

      <footer className="border-t-2 border-ink px-6 py-6">
        <p className="mx-auto max-w-6xl text-caption font-bold uppercase opacity-70">
          © À un flâneur · Astelier — {t.footerTagline} ·{" "}
          <a href="mailto:atelier@aunflaneur.com" className="border-b-2 border-ink hover:text-ink">
            {t.contact}
          </a>
        </p>
      </footer>
    </>
  );
}
