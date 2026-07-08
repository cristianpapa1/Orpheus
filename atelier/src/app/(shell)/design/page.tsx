import { Window } from "@/components/ui/Window";
import { WindowGrid } from "@/components/ui/WindowGrid";

const SWATCHES = [
  { name: "Ink", cls: "bg-ink", hex: "#121210" },
  { name: "Paper", cls: "bg-paper border-2 border-ink", hex: "#F5F3EC" },
  { name: "Red", cls: "bg-red", hex: "#E1251B" },
  { name: "Blue", cls: "bg-blue", hex: "#2145C9" },
  { name: "Yellow", cls: "bg-yellow", hex: "#F2B705" },
];

/** Living styleguide — the design system demonstrating itself. */
export default function DesignPage() {
  return (
    <WindowGrid>
      <Window title="Palette" accent="red" span="col-span-12 md:col-span-6">
        <ul className="grid grid-cols-5 gap-3">
          {SWATCHES.map((s) => (
            <li key={s.name}>
              <span className={`block h-16 ${s.cls}`} title={s.hex} />
              <p className="mt-2 text-caption font-bold uppercase">{s.name}</p>
              <p className="text-caption">{s.hex}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-body">
          Black, white, red, blue, yellow. Nothing else, anywhere.
        </p>
      </Window>

      <Window title="Type scale" accent="blue" span="col-span-12 md:col-span-6">
        <p className="text-display font-bold uppercase">Display</p>
        <p className="text-h1 font-bold">Heading one</p>
        <p className="text-h2 font-bold">Heading two</p>
        <p className="text-body">
          Body — geometric sans (Space Grotesk), 1rem / 1.55.
        </p>
        <p className="text-caption font-bold uppercase">
          Caption — 0.75rem, tracked wide
        </p>
      </Window>

      <Window title="Window / red" accent="red" span="col-span-12 md:col-span-4">
        <p className="text-body">The recurring unit of the facade.</p>
      </Window>
      <Window title="Window / blue" accent="blue" span="col-span-12 md:col-span-4">
        <p className="text-body">2px ink border, paper fill, accent square.</p>
      </Window>
      <Window title="Window / yellow" accent="yellow" span="col-span-12 md:col-span-4">
        <p className="text-body">
          Placed on a 12-column grid, asymmetric but balanced.
        </p>
      </Window>
    </WindowGrid>
  );
}
