# Atelier Design System — Bauhaus / Gropius

Cards read as **windows** in a facade: modular, geometric, functional,
asymmetric-but-balanced. Nothing decorative-for-decoration's-sake.
Living styleguide at [`/design`](http://localhost:3000/design).

## Palette (closed — five values, nothing else)

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `--color-ink` | `#121210` | `bg-ink text-ink border-ink` | Black — borders, text, structure |
| `--color-paper` | `#F5F3EC` | `bg-paper text-paper` | White — warm gallery-white surfaces |
| `--color-red` | `#E1251B` | `bg-red` | Primary accent |
| `--color-blue` | `#2145C9` | `bg-blue` | Primary accent |
| `--color-yellow` | `#F2B705` | `bg-yellow` | Primary accent |

Accents are used as **squares, bars, and hover fills** — never as large
background washes. Adding any hue outside this table is a design-system
violation (ISA anti-criterion ISC-41).

## Typography

Geometric sans-serif: **Space Grotesk** via `next/font` (`--font-grotesk`),
with Futura-class fallbacks. Strict scale — pick from these steps only:

| Token | Size / leading | Tailwind |
|---|---|---|
| display | 4rem / 1.02, -0.02em | `text-display` |
| h1 | 2.5rem / 1.1 | `text-h1` |
| h2 | 1.5rem / 1.2 | `text-h2` |
| body | 1rem / 1.55 | `text-body` |
| caption | 0.75rem / 1.4, +0.18em | `text-caption` |

Captions and labels are `font-bold uppercase` — machine-shop labeling.

## Grid & spacing

- Modular unit: **8px** (`--spacing-unit`, also `--unit`).
- Layout: 12-column `WindowGrid` (`grid-cols-12 gap-4`), max-width 6xl.
- Windows span asymmetric column counts (8/4, 5/7, 4/4/4) — balanced, never uniform.

## The `<Window>` primitive

`src/components/ui/Window.tsx` — every card-like surface on the platform.

```tsx
<WindowGrid>
  <Window title="Feed" accent="red" span="col-span-12 md:col-span-8">
    …content…
  </Window>
</WindowGrid>
```

- 2px `ink` border, `paper` fill.
- Title bar: accent square (`red | blue | yellow`) + caption-case title.
- Enters with the `windowIn` motion preset (`src/lib/design/motion.ts`):
  mechanical 280ms ease `[0.2, 0, 0, 1]`, no bounce. `facadeStagger`
  staggers sibling windows like lights coming on in a building.

## Rules of thumb

1. Compose pages from `Window` + `WindowGrid` — no ad-hoc cards.
2. Borders are structural: 2px ink. Hairlines don't exist here.
3. Negative space is a material — don't fill every column.
4. Hover states flip to a primary fill with `text-paper`.
5. Uppercase + tracking for labels; sentence case for prose.
