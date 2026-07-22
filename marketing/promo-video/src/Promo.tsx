import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";

const { fontFamily } = loadFont();

export const FPS = 30;
export const DURATION = 1500; // 50s @ 30fps

// ── À un flâneur / Atelier brand ──────────────────────────────────
const PAPER = "#f5f3ec";
const INK = "#111111";
const BLUE = "#2145c9";
const RED = "#e1251b";
const YELLOW = "#f2b705";

// ── frame helpers (all clamped — see CriticalRules) ───────────────
const fade = (f: number, delay: number, dur = 18) =>
  interpolate(f, [delay, delay + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rise = (f: number, delay: number, dist = 60, dur = 22) =>
  interpolate(f, [delay, delay + dur], [dist, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const fadeOut = (f: number, start: number, dur = 12) =>
  interpolate(f, [start, start + dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// ── shared bits ───────────────────────────────────────────────────
const Mark: React.FC<{ kind: "square" | "diamond" | "circle"; color: string; size: number; style?: React.CSSProperties }> = ({
  kind,
  color,
  size,
  style,
}) => (
  <div
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      borderRadius: kind === "circle" ? "50%" : 0,
      transform: kind === "diamond" ? "rotate(45deg)" : undefined,
      ...style,
    }}
  />
);

const Marks: React.FC<{ f: number; size?: number; gap?: number }> = ({ f, size = 84, gap = 26 }) => {
  const { fps } = useVideoConfig();
  const s = (i: number) => spring({ frame: f - i * 6, fps, config: { damping: 12, mass: 0.7 } });
  return (
    <div style={{ display: "flex", gap, alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${s(0)})` }}>
        <Mark kind="square" color={RED} size={size} />
      </div>
      <div style={{ transform: `scale(${s(1)})` }}>
        <Mark kind="diamond" color={BLUE} size={size * 0.82} />
      </div>
      <div style={{ transform: `scale(${s(2)})` }}>
        <Mark kind="circle" color={YELLOW} size={size} />
      </div>
    </div>
  );
};

/** Bottom caption block — big uppercase lines with an accent square. */
const Caption: React.FC<{ f: number; delay?: number; accent?: string; children: React.ReactNode }> = ({
  f,
  delay = 6,
  accent = RED,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: 64,
      right: 64,
      bottom: 150,
      opacity: fade(f, delay),
      transform: `translateY(${rise(f, delay)}px)`,
    }}
  >
    <div style={{ width: 54, height: 54, backgroundColor: accent, marginBottom: 26 }} />
    <div style={{ fontSize: 74, fontWeight: 700, lineHeight: 1.02, letterSpacing: -1, color: INK }}>
      {children}
    </div>
  </div>
);

/** A Bauhaus "window" — bordered card with a titlebar. */
const Window: React.FC<{ title: string; accent: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({
  title,
  accent,
  children,
  style,
}) => (
  <div style={{ border: `4px solid ${INK}`, background: PAPER, ...style }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: `4px solid ${INK}`, padding: "18px 22px" }}>
      <div style={{ width: 26, height: 26, background: accent }} />
      <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: INK }}>{title}</span>
    </div>
    <div style={{ padding: 22 }}>{children}</div>
  </div>
);

const Line: React.FC<{ w: string; h?: number }> = ({ w, h = 22 }) => (
  <div style={{ width: w, height: h, background: "#d9d5c7", marginBottom: 14 }} />
);

const SceneWrap: React.FC<{ f: number; children: React.ReactNode; hold: number }> = ({ f, children, hold }) => (
  <AbsoluteFill style={{ opacity: fadeOut(f, hold) }}>{children}</AbsoluteFill>
);

// ── Scenes ────────────────────────────────────────────────────────
const Opener: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fadeOut(f, 132) }}>
      <Marks f={f} size={120} gap={40} />
      <div
        style={{
          marginTop: 60,
          fontSize: 78,
          fontWeight: 700,
          letterSpacing: 4,
          color: INK,
          opacity: fade(f, 36),
          transform: `translateY(${rise(f, 36)}px)`,
        }}
      >
        À UN FLÂNEUR
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 40,
          color: INK,
          opacity: fade(f, 54),
          maxWidth: 800,
          textAlign: "center",
          lineHeight: 1.15,
        }}
      >
        a space for the technē of our culture
      </div>
    </AbsoluteFill>
  );
};

const Problem: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 80, opacity: fadeOut(f, 102) }}>
      <div style={{ fontSize: 64, fontWeight: 700, color: INK, textAlign: "center", lineHeight: 1.08, opacity: fade(f, 4), transform: `translateY(${rise(f, 4)}px)` }}>
        Tired of Amazon,
        <br />
        Instagram &amp; generic
        <br />
        platforms?
      </div>
      <div style={{ display: "flex", gap: 22, marginTop: 60, opacity: fade(f, 30) }}>
        <Mark kind="square" color={RED} size={40} />
        <Mark kind="diamond" color={BLUE} size={34} />
        <Mark kind="circle" color={YELLOW} size={40} />
      </div>
    </AbsoluteFill>
  );
};

const Feed: React.FC = () => {
  const f = useCurrentFrame();
  const scroll = interpolate(f, [30, 200], [0, -260], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <SceneWrap f={f} hold={192}>
      <AbsoluteFill style={{ padding: "90px 64px 0" }}>
        <div style={{ transform: `translateY(${scroll}px)`, display: "flex", flexDirection: "column", gap: 40, opacity: fade(f, 4) }}>
          <Window title="Photography" accent={BLUE}>
            <div style={{ height: 300, background: "#cfc9b8", marginBottom: 16 }} />
            <Line w="70%" />
            <Line w="45%" />
          </Window>
          <Window title="Writing & Poetry" accent={RED}>
            <Line w="90%" />
            <Line w="80%" />
            <Line w="55%" />
          </Window>
          <Window title="Handmade" accent={YELLOW}>
            <div style={{ height: 260, background: "#cfc9b8" }} />
          </Window>
        </div>
      </AbsoluteFill>
      <Caption f={f} delay={40} accent={BLUE}>
        Reaches everyone
        <br />
        who follows you —
        <br />
        <span style={{ color: BLUE }}>in order. No algorithm.</span>
      </Caption>
    </SceneWrap>
  );
};

const Composer: React.FC = () => {
  const f = useCurrentFrame();
  const pressed = f > 90;
  return (
    <SceneWrap f={f} hold={162}>
      <AbsoluteFill style={{ padding: "110px 64px 0", opacity: fade(f, 4) }}>
        <Window title="Publish your work" accent={RED}>
          <Line w="100%" h={40} />
          <div style={{ height: 18 }} />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 26 }}>
            {["Art", "Writing", "Music", "Film", "Handmade"].map((c, i) => (
              <span
                key={c}
                style={{
                  border: `3px solid ${INK}`,
                  padding: "8px 16px",
                  fontSize: 24,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  background: i === 0 ? INK : PAPER,
                  color: i === 0 ? PAPER : INK,
                  opacity: fade(f, 20 + i * 6),
                }}
              >
                {c}
              </span>
            ))}
          </div>
          <div
            style={{
              alignSelf: "flex-start",
              display: "inline-block",
              border: `4px solid ${INK}`,
              background: pressed ? BLUE : INK,
              color: PAPER,
              padding: "18px 34px",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              transform: `scale(${pressed ? 0.96 : 1})`,
            }}
          >
            {pressed ? "Published ✓" : "Publish"}
          </div>
        </Window>
      </AbsoluteFill>
      <Caption f={f} delay={30} accent={RED}>
        The seven arts,
        <br />
        handmade &amp; more.
      </Caption>
    </SceneWrap>
  );
};

const Heroes: React.FC = () => {
  const f = useCurrentFrame();
  const hrs = 24 - Math.floor(interpolate(f, [0, 180], [0, 3], { extrapolateRight: "clamp" }));
  return (
    <SceneWrap f={f} hold={192}>
      <AbsoluteFill style={{ background: INK, opacity: fade(f, 3) }}>
        {/* mock hero video area */}
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 120, color: "rgba(245,243,236,0.25)" }}>▶</div>
        </AbsoluteFill>
        <div style={{ position: "absolute", top: 70, right: 56, border: `3px solid ${PAPER}`, color: PAPER, padding: "10px 18px", fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>
          ⏳ {hrs}H
        </div>
        <div style={{ position: "absolute", right: 56, bottom: 320, color: PAPER, textAlign: "center", opacity: fade(f, 24) }}>
          <div style={{ fontSize: 60, color: RED }}>♥</div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>128</div>
        </div>
        <div style={{ position: "absolute", left: 64, right: 64, bottom: 150, opacity: fade(f, 10), transform: `translateY(${rise(f, 10)}px)` }}>
          <div style={{ width: 54, height: 54, background: YELLOW, marginBottom: 24 }} />
          <div style={{ fontSize: 76, fontWeight: 700, color: PAPER, lineHeight: 1.02, letterSpacing: -1 }}>
            Heroes —
            <br />
            <span style={{ color: YELLOW }}>just for one day.</span>
          </div>
        </div>
      </AbsoluteFill>
    </SceneWrap>
  );
};

const Curators: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <SceneWrap f={f} hold={132}>
      <AbsoluteFill style={{ padding: "150px 64px 0", opacity: fade(f, 4) }}>
        <Window title="♺ Curated by Inês ✦" accent={YELLOW}>
          <div style={{ height: 320, background: "#cfc9b8", marginBottom: 16 }} />
          <Line w="65%" />
        </Window>
      </AbsoluteFill>
      <Caption f={f} delay={20} accent={YELLOW}>
        Curators
        <br />
        surface quality.
      </Caption>
    </SceneWrap>
  );
};

const Astelier: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <SceneWrap f={f} hold={192}>
      <AbsoluteFill style={{ padding: "90px 64px 0", opacity: fade(f, 4) }}>
        <div style={{ fontSize: 60, fontWeight: 700, letterSpacing: 3, color: INK, marginBottom: 34 }}>ASTELIER</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
          {[RED, BLUE, YELLOW, INK].map((c, i) => (
            <div key={i} style={{ border: `4px solid ${INK}`, opacity: fade(f, 12 + i * 5) }}>
              <div style={{ height: 220, background: "#cfc9b8" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderTop: `4px solid ${INK}` }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: INK }}>${18 + i * 9}</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: c === INK ? INK : c }}>Buy →</span>
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
      <Caption f={f} delay={30} accent={RED}>
        Sell what you make.
        <br />
        <span style={{ color: BLUE }}>0% platform fee.</span>
      </Caption>
    </SceneWrap>
  );
};

const Values: React.FC = () => {
  const f = useCurrentFrame();
  const rows = ["No ads.", "No pay-to-be-seen.", "You're in control."];
  return (
    <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "center", padding: 72, opacity: fadeOut(f, 132) }}>
      {rows.map((r, i) => (
        <div
          key={r}
          style={{
            fontSize: 82,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.12,
            letterSpacing: -1,
            opacity: fade(f, 6 + i * 16),
            transform: `translateX(${interpolate(fade(f, 6 + i * 16), [0, 1], [-40, 0])}px)`,
          }}
        >
          {r}
        </div>
      ))}
      <div style={{ display: "flex", gap: 20, marginTop: 50, opacity: fade(f, 60) }}>
        <Mark kind="square" color={RED} size={40} />
        <Mark kind="diamond" color={BLUE} size={34} />
        <Mark kind="circle" color={YELLOW} size={40} />
      </div>
    </AbsoluteFill>
  );
};

const CTA: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Marks f={f} size={104} gap={34} />
      <div style={{ marginTop: 54, fontSize: 70, fontWeight: 700, letterSpacing: 4, color: INK, opacity: fade(f, 20) }}>
        À UN FLÂNEUR
      </div>
      <div
        style={{
          marginTop: 30,
          border: `4px solid ${INK}`,
          background: INK,
          color: PAPER,
          padding: "20px 40px",
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: 1,
          opacity: fade(f, 36),
          transform: `scale(${interpolate(fade(f, 36), [0, 1], [0.9, 1])})`,
        }}
      >
        atelier.aunflaneur.com
      </div>
    </AbsoluteFill>
  );
};

export const Promo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER, fontFamily }}>
    <Sequence durationInFrames={150}><Opener /></Sequence>
    <Sequence from={150} durationInFrames={120}><Problem /></Sequence>
    <Sequence from={270} durationInFrames={210}><Feed /></Sequence>
    <Sequence from={480} durationInFrames={180}><Composer /></Sequence>
    <Sequence from={660} durationInFrames={210}><Heroes /></Sequence>
    <Sequence from={870} durationInFrames={150}><Curators /></Sequence>
    <Sequence from={1020} durationInFrames={210}><Astelier /></Sequence>
    <Sequence from={1230} durationInFrames={150}><Values /></Sequence>
    <Sequence from={1380} durationInFrames={120}><CTA /></Sequence>
  </AbsoluteFill>
);
