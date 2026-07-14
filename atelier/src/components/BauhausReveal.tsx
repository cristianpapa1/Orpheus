"use client";

import { useEffect, useState } from "react";

// Plays once per full page load (reload / first load), not on every in-app
// navigation: a module-scoped flag survives client-side route changes but
// resets when the document actually reloads.
let playedThisLoad = false;

const DURATION = 1900; // ms — matches the CSS timeline below

/**
 * Bauhaus load reveal — a Kandinsky/Mondrian/Klee composition assembles from
 * nothing, holds a beat, then wipes away in staggered columns to reveal the
 * page. Pure transform/opacity (GPU-composited), crisp SVG, no dependencies.
 * Decorative and non-blocking (pointer-events: none); honors reduced-motion.
 */
export function BauhausReveal() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (playedThisLoad) {
      setVisible(false);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      playedThisLoad = true;
      setVisible(false);
      return;
    }
    playedThisLoad = true;
    const t = setTimeout(() => setVisible(false), DURATION);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="bh-reveal" aria-hidden="true">
      <style>{STYLES}</style>

      {/* paper backdrop that wipes away, column by column */}
      <div className="bh-cols">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="bh-col" style={{ animationDelay: `${1.1 + i * 0.05}s` }} />
        ))}
      </div>

      {/* the composition */}
      <div className="bh-stage">
        <svg viewBox="0 0 200 200" className="bh-svg">
          <rect className="bh-vbar" x="128" y="6" width="5" height="188" fill="var(--color-ink)" />
          <rect className="bh-hbar" x="6" y="70" width="188" height="5" fill="var(--color-ink)" />
          <line className="bh-diag" x1="18" y1="188" x2="188" y2="24" stroke="var(--color-ink)" strokeWidth="3" />
          <rect className="bh-red" x="26" y="18" width="54" height="54" fill="var(--color-red)" />
          <circle className="bh-blue" cx="150" cy="120" r="30" fill="var(--color-blue)" />
          <polygon className="bh-yellow" points="58,116 92,180 24,180" fill="var(--color-yellow)" />
          <circle className="bh-klee" cx="172" cy="40" r="9" fill="var(--color-red)" />
        </svg>
      </div>
    </div>
  );
}

const STYLES = `
.bh-reveal { position: fixed; inset: 0; z-index: 70; pointer-events: none; overflow: hidden; }
.bh-cols { position: absolute; inset: 0; display: flex; }
.bh-col { flex: 1 1 0; background: var(--color-paper); transform: translateY(0);
  animation: bhColUp 0.5s cubic-bezier(0.76, 0, 0.24, 1) forwards; will-change: transform; }
.bh-stage { position: absolute; inset: 0; display: grid; place-items: center;
  animation: bhStageOut 0.3s ease-in 1s forwards; }
.bh-svg { width: min(58vw, 320px); height: auto; overflow: visible; }
.bh-svg > * { transform-box: fill-box; transform-origin: center; }

.bh-vbar   { animation: bhDrawV 0.45s cubic-bezier(0.2,0.8,0.2,1) 0s   both; }
.bh-hbar   { animation: bhDrawH 0.45s cubic-bezier(0.2,0.8,0.2,1) 0.1s both; }
.bh-diag   { stroke-dasharray: 240; stroke-dashoffset: 240; animation: bhDraw 0.6s ease-out 0.3s both; }
.bh-red    { animation: bhSquareIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both; }
.bh-blue   { animation: bhPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.28s both; }
.bh-yellow { animation: bhDrop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.4s both; }
.bh-klee   { animation: bhPop 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.52s both; }

@keyframes bhDrawV { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes bhDrawH { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes bhDraw  { to { stroke-dashoffset: 0; } }
@keyframes bhPop   { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
@keyframes bhSquareIn { from { opacity: 0; transform: scale(0) rotate(-28deg); } to { opacity: 1; transform: scale(1) rotate(0); } }
@keyframes bhDrop  { from { opacity: 0; transform: translateY(-34px) rotate(-18deg); } to { opacity: 1; transform: translateY(0) rotate(0); } }
@keyframes bhStageOut { to { opacity: 0; transform: scale(0.9); } }
@keyframes bhColUp { to { transform: translateY(-101%); } }

@media (prefers-reduced-motion: reduce) {
  .bh-reveal { display: none; }
}
`;
