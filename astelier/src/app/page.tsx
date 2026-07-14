import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";
import { Nav } from "@/components/Nav";
import { getGateState, REQUIRED_FOLLOWS } from "@/lib/gate";

const ATELIER_URL = "https://atelier.aunflaneur.com";

export default async function AstelierHome() {
  const gate = await getGateState();
  const pct = Math.min(100, Math.round((gate.followCount / REQUIRED_FOLLOWS) * 100));

  return (
    <>
      <Nav signedIn={gate.signedIn} />
      <main id="main" className="mx-auto w-full max-w-6xl grow px-6 py-12">
        <section className="mb-10">
          <h1 className="text-display font-bold uppercase leading-none">
            Sell what
            <br />
            you make.
          </h1>
          <p className="mt-6 max-w-md text-body">
            Astelier is where Atelier makers sell — the same community, the same
            Bauhaus rooms, a place of its own for commerce. No ads, no boosted
            listings. The maker owns the sale.
          </p>
        </section>

        {!gate.signedIn ? (
          <WindowGrid>
            <Window title="Enter" accent="blue" span="col-span-12 md:col-span-7">
              <p className="text-body">
                Your Atelier account is your Astelier account — one sign-in.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
              >
                Sign in →
              </Link>
            </Window>
            <Window title="How it works" accent="yellow" span="col-span-12 md:col-span-5">
              <p className="text-body">
                Follow at least {REQUIRED_FOLLOWS} makers on Atelier and Astelier
                opens. You take part in the community before you transact.
              </p>
            </Window>
          </WindowGrid>
        ) : gate.unlocked ? (
          <WindowGrid>
            <Window
              title={gate.displayName ? `Welcome, ${gate.displayName}` : "Welcome"}
              accent="red"
              span="col-span-12 md:col-span-7"
            >
              <p className="text-body">
                You&apos;re in. Astelier is opening in stages — stores and a maker
                catalog are next.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase opacity-50">
                  Open your store — soon
                </span>
                <span className="border-2 border-ink px-4 py-2 text-caption font-bold uppercase opacity-50">
                  Browse makers — soon
                </span>
              </div>
            </Window>
            <Window title="Access" accent="blue" span="col-span-12 md:col-span-5">
              <p className="text-body font-bold uppercase">Unlocked</p>
              <p className="mt-2 text-body">
                {gate.followCount} makers followed on Atelier.
              </p>
            </Window>
          </WindowGrid>
        ) : (
          <WindowGrid>
            <Window title="Almost in" accent="yellow" span="col-span-12 md:col-span-7">
              <p className="text-body">
                Astelier opens once you follow{" "}
                <strong>{REQUIRED_FOLLOWS}</strong> makers on Atelier. You take
                part in the community before you transact.
              </p>
              <div className="mt-6">
                <div className="flex justify-between text-caption font-bold uppercase">
                  <span>
                    {gate.followCount} / {REQUIRED_FOLLOWS}
                  </span>
                  <span>{gate.remaining} to go</span>
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
                Find makers on Atelier →
              </a>
            </Window>
            <Window title="Why fifteen?" accent="blue" span="col-span-12 md:col-span-5">
              <p className="text-body">
                Commerce that grows out of a community, not a storefront dropped on
                strangers. Follow the makers whose work you&apos;d want to buy.
              </p>
            </Window>
          </WindowGrid>
        )}
      </main>

      <footer className="border-t-2 border-ink px-6 py-6">
        <p className="mx-auto max-w-6xl text-caption font-bold uppercase opacity-70">
          © À un flâneur · Astelier — the commerce sibling to Atelier
        </p>
      </footer>
    </>
  );
}
