import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";

export default function ProfilePage() {
  return (
    <WindowGrid>
      <Window title="Your space" accent="yellow" span="col-span-12 md:col-span-7">
        <p className="text-h2 font-bold uppercase">Build your own space.</p>
        <p className="mt-4 max-w-md text-body">
          Your profile is yours to construct — arrange, resize, and reorder
          your windows. The editor arrives in phase 1.
        </p>
      </Window>
      <Window title="Identity" accent="red" span="col-span-12 md:col-span-5">
        <p className="text-body">
          Display name, handle, bio, links — and a fully adjustable windowed
          layout. No boring default grid.
        </p>
      </Window>
    </WindowGrid>
  );
}
