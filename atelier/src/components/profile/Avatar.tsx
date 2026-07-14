/**
 * A small, circular profile photo. Timid by design — a quiet ink-bordered
 * circle next to a name. Falls back to a monogram (first initial on ink) when
 * a profile has no photo yet, so the layout never shifts.
 *
 * Decorative: the profile name always sits right next to it, so the image is
 * aria-hidden with an empty alt rather than repeating the name to a reader.
 */

const SIZES = {
  sm: "size-6 text-caption", // ~24px — inline next to @handle in a post header
  md: "size-10 text-body", // ~40px — the bio block, beside the name
  lg: "size-14 text-h2", // ~56px — reserved for larger headers
} as const;

export type AvatarSize = keyof typeof SIZES;

export function Avatar({
  url,
  name,
  size = "md",
  className = "",
}: {
  url: string | null | undefined;
  name: string;
  size?: AvatarSize;
  className?: string;
}) {
  const box = `${SIZES[size]} shrink-0 rounded-full border-2 border-ink ${className}`;

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatars are tiny, arbitrary-host URLs; next/image adds no value here
      <img
        src={url}
        alt=""
        aria-hidden
        loading="lazy"
        className={`${box} bg-paper object-cover`}
      />
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
