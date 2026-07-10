import Link from "next/link";
import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";

export const metadata = { title: "Welcome — Atelier" };

export default function WelcomePage() {
  return (
    <div>
      <h1 className="mb-2 text-display font-bold uppercase">
        Welcome
        <br />
        to the atelier.
      </h1>
      <p className="mb-8 max-w-xl text-body">
        This is a place for people who make things. No ads, no algorithm, no
        sellers — three moves and you&apos;re home.
      </p>
      <WindowGrid>
        <Window title="1 · Build your space" accent="red" span="col-span-12 md:col-span-4">
          <p className="text-body">
            Your profile is a facade you arrange yourself — drag, resize,
            reorder your windows. Pick your accent.
          </p>
          <Link href="/profile/edit" className="mt-4 inline-block border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-red hover:border-red">
            Open the editor →
          </Link>
        </Window>
        <Window title="2 · Show your work" accent="blue" span="col-span-12 md:col-span-4">
          <p className="text-body">
            Post what you make. Your original file is kept untouched, full
            resolution — always. You decide how each piece displays.
          </p>
          <Link href="/post/new" className="mt-4 inline-block border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue">
            Publish work →
          </Link>
        </Window>
        <Window title="3 · Find your people" accent="yellow" span="col-span-12 md:col-span-4">
          <p className="text-body">
            Follow creators, join groups by invitation, and your feed fills
            up — in the order things were made, nothing more.
          </p>
          <Link href="/groups" className="mt-4 inline-block border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-yellow hover:border-yellow hover:text-ink">
            Browse groups →
          </Link>
        </Window>
      </WindowGrid>
    </div>
  );
}
