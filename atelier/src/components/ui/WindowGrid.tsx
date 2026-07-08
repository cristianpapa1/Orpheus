/**
 * WindowGrid — the 12-column modular facade grid.
 * Windows place themselves with `span` classes (asymmetric-but-balanced).
 */
export function WindowGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-grid className={`grid grid-cols-12 gap-4 ${className ?? ""}`}>
      {children}
    </div>
  );
}
