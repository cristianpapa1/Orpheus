/**
 * Renders a text post (poem / paragraph). The box grows with the words up to
 * a sensible cap, then scrolls — line breaks preserved. `full` lifts the cap
 * on the post's own detail page.
 */
export function TextBody({
  body,
  full = false,
  className,
}: {
  body: string;
  full?: boolean;
  className?: string;
}) {
  return (
    <div
      data-text-body
      className={`overflow-y-auto whitespace-pre-wrap break-words text-body leading-relaxed ${
        full ? "max-h-[70vh]" : "max-h-[28rem]"
      } ${className ?? ""}`}
    >
      {body}
    </div>
  );
}
