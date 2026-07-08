import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";

export default function FeedPage() {
  return (
    <WindowGrid>
      <Window title="Feed" accent="red" span="col-span-12 md:col-span-8">
        <p className="text-h2 font-bold uppercase">Nothing here yet.</p>
        <p className="mt-4 max-w-md text-body">
          Work from the creators and groups you follow will appear here — in
          the order it was made. Chronological, always.
        </p>
      </Window>
      <Window title="How it works" accent="blue" span="col-span-12 md:col-span-4">
        <p className="text-body">
          No algorithmic ranking. No ads. Nothing pays for reach. What you
          follow is what you see.
        </p>
      </Window>
    </WindowGrid>
  );
}
