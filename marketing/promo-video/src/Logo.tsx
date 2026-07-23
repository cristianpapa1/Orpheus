import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";

const { fontFamily } = loadFont();
const PAPER = "#f5f3ec", INK = "#111111", BLUE = "#2145c9", RED = "#e1251b", YELLOW = "#f2b705";

const Marks: React.FC<{ s: number; gap: number }> = ({ s, gap }) => (
  <div style={{ display: "flex", alignItems: "center", gap }}>
    <div style={{ width: s, height: s, background: RED }} />
    <svg width={s} height={s} viewBox="0 0 100 100"><polygon points="50,4 96,96 4,96" fill={BLUE} /></svg>
    <div style={{ width: s, height: s, borderRadius: "50%", background: YELLOW }} />
  </div>
);

/** Brand lockup: marks + wordmark. `square` for profile posts, `banner` for headers. */
export const Logo: React.FC<{ variant?: "square" | "banner"; wordmark?: boolean }> = ({ variant = "square", wordmark = true }) => {
  if (variant === "banner") {
    return (
      <AbsoluteFill style={{ background: PAPER, fontFamily, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 56 }}>
        <Marks s={150} gap={44} />
        {wordmark ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: 2, color: INK, lineHeight: 1 }}>À UN FLÂNEUR</div>
            <div style={{ fontSize: 30, color: INK, opacity: 0.75 }}>a space for the technē of our culture</div>
          </div>
        ) : null}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily, alignItems: "center", justifyContent: "center", gap: 70 }}>
      <Marks s={210} gap={64} />
      {wordmark ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 118, fontWeight: 700, letterSpacing: 3, color: INK, lineHeight: 1 }}>À UN FLÂNEUR</div>
          <div style={{ marginTop: 22, fontSize: 40, color: INK, opacity: 0.75 }}>a space for the technē of our culture</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
