"use client";

import { motion } from "framer-motion";
import { windowIn } from "@/lib/design/motion";

export type WindowAccent = "red" | "blue" | "yellow";

const ACCENT_BG: Record<WindowAccent, string> = {
  red: "bg-red",
  blue: "bg-blue",
  yellow: "bg-yellow",
};

export interface WindowProps {
  /** Title shown in the window's header bar. Omit for a frameless pane. */
  title?: string;
  /** Primary accent for the header square. Bauhaus palette only. */
  accent?: WindowAccent;
  /** Grid placement classes, e.g. "col-span-12 md:col-span-8". */
  span?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * <Window> — the recurring unit of the Atelier facade.
 * Every card-like surface on the platform is a Window: 2px ink border,
 * paper fill, caption-case title bar with a primary accent square.
 */
export function Window({
  title,
  accent = "red",
  span,
  className,
  children,
}: WindowProps) {
  return (
    <motion.section
      data-window
      variants={windowIn}
      initial="closed"
      animate="open"
      className={`flex flex-col border-2 border-ink bg-paper ${span ?? ""} ${className ?? ""}`}
    >
      {title ? (
        <header className="flex items-center gap-3 border-b-2 border-ink px-4 py-2">
          <span aria-hidden data-accent className={`size-3 ${ACCENT_BG[accent]}`} />
          <h2 className="text-caption font-bold uppercase">{title}</h2>
        </header>
      ) : null}
      <div className="grow p-6">{children}</div>
    </motion.section>
  );
}
