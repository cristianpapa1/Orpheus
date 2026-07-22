import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";

const { fontFamily } = loadFont();

export const FPS = 30;
export const DURATION = 1740; // 58s @ 30fps

// ── À un flâneur / Atelier brand ──────────────────────────────────
const PAPER = "#f5f3ec";
const INK = "#111111";
const BLUE = "#2145c9";
const RED = "#e1251b";
const YELLOW = "#f2b705";
const MUTE = "#8a877c";

const PAINTINGS = ["art/starry-night.jpg", "art/great-wave.jpg", "art/pearl-earring.jpg", "art/the-kiss.jpg"];

// ── frame helpers (all clamped) ───────────────────────────────────
const fade = (f: number, delay: number, dur = 18) =>
  interpolate(f, [delay, delay + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rise = (f: number, delay: number, dist = 60, dur = 22) =>
  interpolate(f, [delay, delay + dur], [dist, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const fadeOut = (f: number, start: number, dur = 14) =>
  interpolate(f, [start, start + dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// ── shared bits ───────────────────────────────────────────────────
const Mark: React.FC<{ kind: "square" | "diamond" | "circle"; color: string; size: number }> = ({ kind, color, size }) => (
  <div style={{ width: size, height: size, backgroundColor: color, borderRadius: kind === "circle" ? "50%" : 0, transform: kind === "diamond" ? "rotate(45deg)" : undefined }} />
);

const Marks: React.FC<{ f: number; size?: number; gap?: number }> = ({ f, size = 84, gap = 26 }) => {
  const { fps } = useVideoConfig();
  const s = (i: number) => spring({ frame: f - i * 6, fps, config: { damping: 12, mass: 0.7 } });
  return (
    <div style={{ display: "flex", gap, alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${s(0)})` }}><Mark kind="square" color={RED} size={size} /></div>
      <div style={{ transform: `scale(${s(1)})` }}><Mark kind="diamond" color={BLUE} size={size * 0.82} /></div>
      <div style={{ transform: `scale(${s(2)})` }}><Mark kind="circle" color={YELLOW} size={size} /></div>
    </div>
  );
};

const Caption: React.FC<{ f: number; delay?: number; accent?: string; light?: boolean; children: React.ReactNode }> = ({ f, delay = 6, accent = RED, light = false, children }) => (
  <div style={{ position: "absolute", left: 64, right: 64, bottom: 150, opacity: fade(f, delay), transform: `translateY(${rise(f, delay)}px)` }}>
    <div style={{ width: 54, height: 54, backgroundColor: accent, marginBottom: 26 }} />
    <div style={{ fontSize: 74, fontWeight: 700, lineHeight: 1.02, letterSpacing: -1, color: light ? PAPER : INK }}>{children}</div>
  </div>
);

const Line: React.FC<{ w: string; h?: number }> = ({ w, h = 22 }) => (
  <div style={{ width: w, height: h, background: "#d9d5c7", marginBottom: 14 }} />
);

const Window: React.FC<{ title: string; accent: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({ title, accent, children, style }) => (
  <div style={{ border: `4px solid ${INK}`, background: PAPER, ...style }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: `4px solid ${INK}`, padding: "18px 22px" }}>
      <div style={{ width: 26, height: 26, background: accent }} />
      <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: INK }}>{title}</span>
    </div>
    <div style={{ padding: 22 }}>{children}</div>
  </div>
);

// ── real-app chrome (matches the live feed) ───────────────────────
const Avatar: React.FC<{ letter: string; color: string }> = ({ letter, color }) => (
  <div style={{ width: 44, height: 44, borderRadius: "50%", background: color, border: `3px solid ${INK}`, display: "grid", placeItems: "center", color: PAPER, fontWeight: 700, fontSize: 22 }}>{letter}</div>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ border: `3px solid ${INK}`, padding: "8px 16px", fontSize: 22, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: INK }}>{children}</span>
);

const ActionRow: React.FC = () => (
  <div style={{ display: "flex", gap: 14, marginTop: 18 }}>
    <Chip>♥ 0</Chip>
    <Chip>⚠ 0</Chip>
    <Chip>Act ▾</Chip>
  </div>
);

const Byline: React.FC<{ letter: string; color: string; name: string; handle: string }> = ({ letter, color, name, handle }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20 }}>
    <Avatar letter={letter} color={color} />
    <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: INK }}>{name} · @{handle}</span>
    <span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: MUTE }}>16 JUL 2026</span>
  </div>
);

const BottomNav: React.FC = () => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: `4px solid ${INK}`, background: PAPER }}>
    {[
      { l: "Feed", c: RED, active: true },
      { l: "Heroes", c: BLUE, active: false },
      { l: "Groups", c: YELLOW, active: false },
      { l: "Chat", c: RED, active: false },
    ].map((t) => (
      <div key={t.l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "20px 0", background: t.active ? INK : "transparent" }}>
        <div style={{ width: 16, height: 16, background: t.c }} />
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: t.active ? PAPER : INK }}>{t.l}</span>
      </div>
    ))}
  </div>
);

// ── Scenes ────────────────────────────────────────────────────────
const Opener: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fadeOut(f, 132) }}>
      <Marks f={f} size={120} gap={40} />
      <div style={{ marginTop: 60, fontSize: 78, fontWeight: 700, letterSpacing: 4, color: INK, opacity: fade(f, 36), transform: `translateY(${rise(f, 36)}px)` }}>À UN FLÂNEUR</div>
      <div style={{ marginTop: 24, fontSize: 40, color: INK, opacity: fade(f, 54), maxWidth: 800, textAlign: "center", lineHeight: 1.15 }}>a space for the technē of our culture</div>
    </AbsoluteFill>
  );
};

const Problem: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 80, opacity: fadeOut(f, 102) }}>
      <div style={{ fontSize: 64, fontWeight: 700, color: INK, textAlign: "center", lineHeight: 1.08, opacity: fade(f, 4), transform: `translateY(${rise(f, 4)}px)` }}>
        Tired of Amazon,<br />Instagram &amp; generic<br />platforms?
      </div>
      <div style={{ display: "flex", gap: 22, marginTop: 60, opacity: fade(f, 30) }}>
        <Mark kind="square" color={RED} size={40} /><Mark kind="diamond" color={BLUE} size={34} /><Mark kind="circle" color={YELLOW} size={40} />
      </div>
    </AbsoluteFill>
  );
};

/** Feed — faithful to the live app: header, cards with byline + actions, carousel, bottom nav. */
const Feed: React.FC = () => {
  const f = useCurrentFrame();
  const scroll = interpolate(f, [40, 210], [0, -230], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const total = 5;
  const active = 2;
  return (
    <AbsoluteFill style={{ background: PAPER, opacity: fadeOut(f, 224) }}>
      {/* header */}
      <div style={{ position: "absolute", left: 48, right: 48, top: 60, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3 }}>
        <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1, color: INK }}>FEED</span>
        <div style={{ background: INK, color: PAPER, padding: "16px 24px", fontSize: 24, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>+ New Post</div>
      </div>
      {/* scrolling cards */}
      <div style={{ position: "absolute", left: 48, right: 48, top: 170, transform: `translateY(${scroll}px)`, display: "flex", flexDirection: "column", gap: 36, opacity: fade(f, 6) }}>
        <div style={{ border: `4px solid ${INK}`, background: PAPER }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: `4px solid ${INK}`, padding: "16px 20px" }}>
            <div style={{ width: 24, height: 24, background: RED }} />
            <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Writing &amp; Poetry</span>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 46, fontWeight: 700, lineHeight: 1.05, color: INK }}>Fresh off the cart — shop the Strand</div>
            <div style={{ marginTop: 14, fontSize: 26, color: INK, lineHeight: 1.3 }}>18 miles of books, plus totes, mugs, and gift cards — browse the shelves and check out on Astelier.</div>
            <Byline letter="S" color={RED} name="Strand" handle="strand" />
            <ActionRow />
          </div>
        </div>
        <div style={{ border: `4px solid ${INK}`, background: PAPER }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: `4px solid ${INK}`, padding: "16px 20px" }}>
            <div style={{ width: 24, height: 24, background: BLUE }} />
            <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Visual Art</span>
          </div>
          <div style={{ position: "relative", background: INK }}>
            <Img src={staticFile("art/starry-night.jpg")} style={{ width: "100%", height: 460, objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", top: 16, right: 16, border: `3px solid ${INK}`, background: PAPER, padding: "6px 12px", fontSize: 22, fontWeight: 700 }}>{active + 1}/{total}</div>
            <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
              {Array.from({ length: total }).map((_, d) => (
                <div key={d} style={{ width: 14, height: 14, border: `2px solid ${PAPER}`, background: d === active ? PAPER : "transparent" }} />
              ))}
            </div>
          </div>
          <div style={{ padding: 24 }}>
            <Byline letter="C" color={INK} name="Cris" handle="cris" />
            <div style={{ marginTop: 12, fontSize: 26, color: INK }}>Starry night, in motion.</div>
            <ActionRow />
          </div>
        </div>
      </div>
      {/* message strip */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, background: BLUE, padding: "22px 48px", opacity: fade(f, 24), zIndex: 3 }}>
        <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: 0, color: PAPER }}>Reaches your followers — in order. No algorithm.</span>
      </div>
      <BottomNav />
    </AbsoluteFill>
  );
};

const Composer: React.FC = () => {
  const f = useCurrentFrame();
  const pressed = f > 90;
  return (
    <AbsoluteFill style={{ padding: "110px 64px 0", opacity: fadeOut(f, 162) }}>
      <Window title="Publish your work" accent={RED}>
        <Line w="100%" h={40} />
        <div style={{ height: 18 }} />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 26 }}>
          {["Art", "Writing", "Music", "Film", "Handmade"].map((c, i) => (
            <span key={c} style={{ border: `3px solid ${INK}`, padding: "8px 16px", fontSize: 24, fontWeight: 700, textTransform: "uppercase", background: i === 0 ? INK : PAPER, color: i === 0 ? PAPER : INK, opacity: fade(f, 20 + i * 6) }}>{c}</span>
          ))}
        </div>
        <div style={{ display: "inline-block", border: `4px solid ${INK}`, background: pressed ? BLUE : INK, color: PAPER, padding: "18px 34px", fontSize: 30, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", transform: `scale(${pressed ? 0.96 : 1})` }}>{pressed ? "Published ✓" : "Publish"}</div>
      </Window>
      <Caption f={f} delay={30} accent={RED}>The seven arts,<br />handmade &amp; more.</Caption>
    </AbsoluteFill>
  );
};

/** Heroes — famous paintings in motion (Ken Burns), not a black frame. */
const Painting: React.FC<{ src: string; from: number; dur: number; f: number }> = ({ src, from, dur, f }) => {
  const scale = interpolate(f, [from, from + dur], [1.1, 1.28], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tx = interpolate(f, [from, from + dur], [-24, 24], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = interpolate(f, [from, from + 12, from + dur - 12, from + dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale}) translateX(${tx}px)` }} />
    </AbsoluteFill>
  );
};

const Heroes: React.FC = () => {
  const f = useCurrentFrame();
  const hrs = 24 - Math.floor(interpolate(f, [0, 200], [0, 3], { extrapolateRight: "clamp" }));
  return (
    <AbsoluteFill style={{ background: INK, opacity: fadeOut(f, 224) }}>
      <Painting src={PAINTINGS[0]} from={0} dur={130} f={f} />
      <Painting src={PAINTINGS[3]} from={118} dur={130} f={f} />
      {/* legibility scrim */}
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)" }} />
      <div style={{ position: "absolute", top: 70, right: 56, border: `3px solid ${PAPER}`, color: PAPER, padding: "10px 18px", fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>⏳ {hrs}H</div>
      <div style={{ position: "absolute", top: 70, left: 56, border: `3px solid ${PAPER}`, color: PAPER, padding: "10px 18px", fontSize: 26, fontWeight: 700, letterSpacing: 1, opacity: fade(f, 6) }}>◆ Tate Late · event</div>
      <div style={{ position: "absolute", right: 56, bottom: 360, color: PAPER, textAlign: "center", opacity: fade(f, 24) }}>
        <div style={{ fontSize: 60, color: RED }}>♥</div>
        <div style={{ fontSize: 30, fontWeight: 700 }}>128</div>
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 150, opacity: fade(f, 12), transform: `translateY(${rise(f, 12)}px)` }}>
        <div style={{ width: 54, height: 54, background: YELLOW, marginBottom: 24 }} />
        <div style={{ fontSize: 76, fontWeight: 700, color: PAPER, lineHeight: 1.02, letterSpacing: -1 }}>Heroes —<br /><span style={{ color: YELLOW }}>just for one day.</span></div>
        <div style={{ marginTop: 18, fontSize: 34, color: PAPER, opacity: 0.9, lineHeight: 1.2 }}>Short video, tied to the events you attend.</div>
      </div>
    </AbsoluteFill>
  );
};

const Curators: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ padding: "150px 64px 0", opacity: fadeOut(f, 132) }}>
      <div style={{ border: `4px solid ${INK}`, background: PAPER, opacity: fade(f, 4) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: `4px solid ${INK}`, padding: "16px 20px" }}>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: INK }}>♺ Curated by Inês ✦</span>
        </div>
        <Img src={staticFile(PAINTINGS[2])} style={{ width: "100%", height: 520, objectFit: "cover", display: "block" }} />
      </div>
      <Caption f={f} delay={20} accent={YELLOW}>Curated &amp; moderated —<br /><span style={{ color: BLUE }}>quality, not spam.</span></Caption>
    </AbsoluteFill>
  );
};

const Astelier: React.FC = () => {
  const f = useCurrentFrame();
  const imgs = [PAINTINGS[1], PAINTINGS[2], PAINTINGS[3], PAINTINGS[0]];
  const cols = [RED, BLUE, YELLOW, INK];
  return (
    <AbsoluteFill style={{ padding: "90px 64px 0", opacity: fadeOut(f, 192) }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginBottom: 34, opacity: fade(f, 2) }}>
        <span style={{ fontSize: 60, fontWeight: 700, letterSpacing: 3, color: INK }}>ASTELIER</span>
        <span style={{ border: `3px solid ${INK}`, padding: "6px 14px", fontSize: 24, fontWeight: 700, letterSpacing: 1, color: INK }}>0% FEE</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
        {imgs.map((src, i) => (
          <div key={i} style={{ border: `4px solid ${INK}`, opacity: fade(f, 12 + i * 5) }}>
            <Img src={staticFile(src)} style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderTop: `4px solid ${INK}` }}>
              <span style={{ fontSize: 30, fontWeight: 700, color: INK }}>${18 + i * 9}</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: cols[i] === INK ? INK : cols[i] }}>Buy →</span>
            </div>
          </div>
        ))}
      </div>
      <Caption f={f} delay={30} accent={RED}>Sell on your own shop —<br /><span style={{ color: BLUE }}>Buy → sends buyers to you.</span></Caption>
    </AbsoluteFill>
  );
};

const Values: React.FC = () => {
  const f = useCurrentFrame();
  const rows = [{ t: "No ads.", c: INK }, { t: "No pay-to-be-seen.", c: INK }, { t: "Funded by donations.", c: BLUE }];
  return (
    <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "center", padding: 72, opacity: fadeOut(f, 162) }}>
      {rows.map((r, i) => (
        <div key={r.t} style={{ fontSize: 84, fontWeight: 700, color: r.c, lineHeight: 1.12, letterSpacing: -1, opacity: fade(f, 6 + i * 18), transform: `translateX(${interpolate(fade(f, 6 + i * 18), [0, 1], [-40, 0])}px)` }}>{r.t}</div>
      ))}
      <div style={{ display: "flex", gap: 20, marginTop: 50, opacity: fade(f, 66) }}>
        <Mark kind="square" color={RED} size={40} /><Mark kind="diamond" color={BLUE} size={34} /><Mark kind="circle" color={YELLOW} size={40} />
      </div>
    </AbsoluteFill>
  );
};

/** Arts-led — the trust signal: run by people from the arts. */
const ArtsLed: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "center", padding: 72, opacity: fadeOut(f, 132) }}>
      <div style={{ width: 54, height: 54, background: YELLOW, marginBottom: 30, opacity: fade(f, 2) }} />
      <div style={{ fontSize: 78, fontWeight: 700, color: INK, lineHeight: 1.06, letterSpacing: -1, opacity: fade(f, 6), transform: `translateY(${rise(f, 6)}px)` }}>
        Built &amp; run by people with a <span style={{ color: BLUE }}>history in the arts</span> —
      </div>
      <div style={{ marginTop: 26, fontSize: 40, color: INK, opacity: fade(f, 30), maxWidth: 860, lineHeight: 1.2 }}>not ad-tech. Curators, not an algorithm.</div>
    </AbsoluteFill>
  );
};

const CTA: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Marks f={f} size={104} gap={34} />
      <div style={{ marginTop: 54, fontSize: 70, fontWeight: 700, letterSpacing: 4, color: INK, opacity: fade(f, 20) }}>À UN FLÂNEUR</div>
      <div style={{ marginTop: 30, border: `4px solid ${INK}`, background: INK, color: PAPER, padding: "20px 40px", fontSize: 40, fontWeight: 700, letterSpacing: 1, opacity: fade(f, 36), transform: `scale(${interpolate(fade(f, 36), [0, 1], [0.9, 1])})` }}>atelier.aunflaneur.com</div>
    </AbsoluteFill>
  );
};

export const Promo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER, fontFamily }}>
    <Sequence durationInFrames={150}><Opener /></Sequence>
    <Sequence from={150} durationInFrames={120}><Problem /></Sequence>
    <Sequence from={270} durationInFrames={240}><Feed /></Sequence>
    <Sequence from={510} durationInFrames={180}><Composer /></Sequence>
    <Sequence from={690} durationInFrames={240}><Heroes /></Sequence>
    <Sequence from={930} durationInFrames={150}><Curators /></Sequence>
    <Sequence from={1080} durationInFrames={210}><Astelier /></Sequence>
    <Sequence from={1290} durationInFrames={180}><Values /></Sequence>
    <Sequence from={1470} durationInFrames={150}><ArtsLed /></Sequence>
    <Sequence from={1620} durationInFrames={120}><CTA /></Sequence>
  </AbsoluteFill>
);
