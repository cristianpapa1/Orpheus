/**
 * A store's logo tile. Reuses the owner's Atelier profile picture — Astelier
 * never asks a maker to upload a second avatar. Hard-edged and ink-bordered to
 * match the storefront (a square, not the round profile avatar). Falls back to
 * a monogram on ink when the owner has no profile picture, so the layout is
 * stable either way.
 *
 * Decorative: the store name always sits next to it, so the image is
 * aria-hidden with an empty alt rather than repeating the name to a reader.
 */

const SIZES = {
  md: "size-16 text-h2", // ~64px — the store info row
  lg: "size-20 text-h1", // ~80px — reserved for larger headers
} as const;

export type StoreLogoSize = keyof typeof SIZES;

export function StoreLogo({
  url,
  name,
  size = "md",
  className = "",
}: {
  url: string | null | undefined;
  name: string;
  size?: StoreLogoSize;
  className?: string;
}) {
  const box = `${SIZES[size]} shrink-0 border-2 border-ink bg-paper ${className}`;

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatars are tiny, arbitrary-host URLs; next/image adds no value here
      <img src={url} alt="" aria-hidden className={`${box} object-cover`} />
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "·";
  return (
    <span
      aria-hidden
      className={`${box} inline-flex items-center justify-center bg-ink font-bold uppercase leading-none text-paper`}
    >
      {initial}
    </span>
  );
}
