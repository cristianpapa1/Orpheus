import React from "react";
import {
  AbsoluteFill,
  Audio,
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

// ── narration-driven timing ───────────────────────────────────────
// Each scene is sized to its voiceover clip (measured with ffprobe) plus a
// short lead-in before the voice starts and a tail after it ends. The whole
// video length falls out of the sum — quicker than the silent cut (~48s).
const VO: { f: string; d: number }[] = [
  { f: "01", d: 5.041633 },
  { f: "02", d: 5.093878 },
  { f: "03", d: 5.851429 },
  { f: "04", d: 3.657143 },
  { f: "05", d: 3.657143 },
  { f: "06", d: 5.694694 },
  { f: "07", d: 2.403265 },
  { f: "08", d: 5.250612 },
  { f: "09", d: 4.545306 },
  { f: "10", d: 4.127347 },
];
const LEAD = 6; // frames before the voice starts in each scene
const TAIL = 12; // frames after the voice ends
const SCENE = VO.map((v) => LEAD + Math.ceil(v.d * FPS) + TAIL);
const STARTS = SCENE.map((_, i) => SCENE.slice(0, i).reduce((a, b) => a + b, 0));
export const DURATION = SCENE.reduce((a, b) => a + b, 0);

// Background music — public-domain Chopin, kept low under the narration.
const musicVol = (f: number) => {
  const inV = interpolate(f, [0, 24], [0, 0.14], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outV = interpolate(f, [DURATION - 36, DURATION], [0.14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return Math.min(inV, outV);
};

// ── brand ─────────────────────────────────────────────────────────
const PAPER = "#f5f3ec";
const INK = "#111111";
const BLUE = "#2145c9";
const RED = "#e1251b";
const YELLOW = "#f2b705";
const MUTE = "#8a877c";

// Public-domain artworks (no trademarks). All maker/space names are FICTIONAL.
const PAINTINGS = ["art/starry-night.jpg", "art/great-wave.jpg", "art/pearl-earring.jpg", "art/the-kiss.jpg"];

const fade = (f: number, d: number, dur = 16) => interpolate(f, [d, d + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rise = (f: number, d: number, dist = 60, dur = 20) => interpolate(f, [d, d + dur], [dist, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// ── shared bits ───────────────────────────────────────────────────
const Mark: React.FC<{ kind: "square" | "diamond" | "circle"; color: string; size: number }> = ({ kind, color, size }) => (
  <div style={{ width: size, height: size, backgroundColor: color, borderRadius: kind === "circle" ? "50%" : 0, transform: kind === "diamond" ? "rotate(45deg)" : undefined }} />
);
const Marks: React.FC<{ f: number; size?: number; gap?: number }> = ({ f, size = 84, gap = 26 }) => {
  const { fps } = useVideoConfig();
  const s = (i: number) => spring({ frame: f - i * 5, fps, config: { damping: 12, mass: 0.6 } });
  return (
    <div style={{ display: "flex", gap, alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${s(0)})` }}><Mark kind="square" color={RED} size={size} /></div>
      <div style={{ transform: `scale(${s(1)})` }}><Mark kind="diamond" color={BLUE} size={size * 0.82} /></div>
      <div style={{ transform: `scale(${s(2)})` }}><Mark kind="circle" color={YELLOW} size={size} /></div>
    </div>
  );
};
const MiniMarks: React.FC = () => (
  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    <Mark kind="square" color={RED} size={22} /><Mark kind="diamond" color={BLUE} size={18} /><Mark kind="circle" color={YELLOW} size={22} />
  </div>
);
const Caption: React.FC<{ f: number; delay?: number; accent?: string; light?: boolean; children: React.ReactNode }> = ({ f, delay = 6, accent = RED, light = false, children }) => (
  <div style={{ position: "absolute", left: 64, right: 64, bottom: 150, opacity: fade(f, delay), transform: `translateY(${rise(f, delay)}px)` }}>
    <div style={{ width: 54, height: 54, backgroundColor: accent, marginBottom: 26 }} />
    <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.02, letterSpacing: -1, color: light ? PAPER : INK }}>{children}</div>
  </div>
);
const Line: React.FC<{ w: string; h?: number }> = ({ w, h = 22 }) => <div style={{ width: w, height: h, background: "#d9d5c7", marginBottom: 14 }} />;
const Window: React.FC<{ title: string; accent: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({ title, accent, children, style }) => (
  <div style={{ border: `4px solid ${INK}`, background: PAPER, ...style }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: `4px solid ${INK}`, padding: "18px 22px" }}>
      <div style={{ width: 26, height: 26, background: accent }} />
      <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: INK }}>{title}</span>
    </div>
    <div style={{ padding: 22 }}>{children}</div>
  </div>
);
const Avatar: React.FC<{ letter: string; color: string; size?: number }> = ({ letter, color, size = 44 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: color, border: `3px solid ${INK}`, display: "grid", placeItems: "center", color: PAPER, fontWeight: 700, fontSize: size * 0.5 }}>{letter}</div>
);
const Chip: React.FC<{ children: React.ReactNode; solid?: boolean }> = ({ children, solid }) => (
  <span style={{ border: `3px solid ${INK}`, background: solid ? INK : PAPER, color: solid ? PAPER : INK, padding: "8px 16px", fontSize: 22, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{children}</span>
);
const ActionRow: React.FC = () => (
  <div style={{ display: "flex", gap: 14, marginTop: 16 }}><Chip>♥ 0</Chip><Chip>⚠ 0</Chip><Chip>Act ▾</Chip></div>
);
const Byline: React.FC<{ letter: string; color: string; name: string; handle: string }> = ({ letter, color, name, handle }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 18 }}>
    <Avatar letter={letter} color={color} />
    <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: INK }}>{name} · @{handle}</span>
    <span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: MUTE }}>16 JUL 2026</span>
  </div>
);
const BottomNav: React.FC<{ tabs: { l: string; c: string }[]; active: number }> = ({ tabs, active }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "grid", gridTemplateColumns: `repeat(${tabs.length},1fr)`, borderTop: `4px solid ${INK}`, background: PAPER, zIndex: 4 }}>
    {tabs.map((t, i) => (
      <div key={t.l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "20px 0", background: i === active ? INK : "transparent" }}>
        <div style={{ width: 16, height: 16, background: t.c }} />
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: i === active ? PAPER : INK }}>{t.l}</span>
      </div>
    ))}
  </div>
);
const ATELIER_TABS = [{ l: "Feed", c: RED }, { l: "Heroes", c: BLUE }, { l: "Groups", c: YELLOW }, { l: "Chat", c: RED }];
const ASTELIER_TABS = [{ l: "Home", c: RED }, { l: "Browse", c: BLUE }, { l: "Search", c: YELLOW }, { l: "Sell", c: INK }];
const Strip: React.FC<{ f: number; delay: number; color: string; children: React.ReactNode }> = ({ f, delay, color, children }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, background: color, padding: "20px 48px", opacity: fade(f, delay), zIndex: 3 }}>
    <span style={{ fontSize: 32, fontWeight: 700, color: PAPER }}>{children}</span>
  </div>
);

// Fades a whole scene in and out around its Sequence length, so cuts are soft
// without every scene tracking its own out-point.
const SceneWrap: React.FC<{ len: number; children: React.ReactNode; bg?: string }> = ({ len, children, bg }) => {
  const f = useCurrentFrame();
  const op = interpolate(f, [0, 8, len - 10, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: op, background: bg }}>{children}</AbsoluteFill>;
};

// ── Scenes (each sized by SCENE[i]) ───────────────────────────────
// Cold open — the message first, no brand. The name lands only at the end (CTA).
const Message1: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "center", padding: 80 }}>
      <div style={{ width: 54, height: 54, background: RED, marginBottom: 30, opacity: fade(f, 2) }} />
      <div style={{ fontSize: 62, fontWeight: 700, color: INK, lineHeight: 1.08, letterSpacing: -1, opacity: fade(f, 4), transform: `translateY(${rise(f, 4)}px)` }}>
        Tired of generic platforms like <span style={{ color: RED }}>Instagram</span> &amp; <span style={{ color: RED }}>Amazon</span> to publish and sell your art?
      </div>
    </AbsoluteFill>
  );
};

const Message2: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "center", padding: 80 }}>
      <div style={{ width: 54, height: 54, background: BLUE, marginBottom: 30, opacity: fade(f, 2) }} />
      <div style={{ fontSize: 60, fontWeight: 700, color: INK, lineHeight: 1.1, letterSpacing: -1, opacity: fade(f, 4), transform: `translateY(${rise(f, 4)}px)` }}>
        Here we&apos;re building a <span style={{ color: BLUE }}>social community</span> worthy of the talent and effort behind your creations.
      </div>
    </AbsoluteFill>
  );
};

const FeedCard: React.FC<{ accent: string; cat: string; children: React.ReactNode }> = ({ accent, cat, children }) => (
  <div style={{ border: `4px solid ${INK}`, background: PAPER }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: `4px solid ${INK}`, padding: "14px 20px" }}><div style={{ width: 24, height: 24, background: accent }} /><span style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{cat}</span></div>
    <div style={{ padding: 22 }}>{children}</div>
  </div>
);

const Feed: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  // Pan down the column through all six posts across the scene.
  const scroll = interpolate(f, [10, len - 12], [0, -1180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <div style={{ position: "absolute", left: 48, right: 48, top: 56, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3, background: PAPER, paddingBottom: 14 }}>
        <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1, color: INK }}>FEED</span>
        <div style={{ background: INK, color: PAPER, padding: "16px 24px", fontSize: 24, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>+ New Post</div>
      </div>
      <div style={{ position: "absolute", left: 48, right: 48, top: 150, transform: `translateY(${scroll}px)`, display: "flex", flexDirection: "column", gap: 28, opacity: fade(f, 4) }}>
        <FeedCard accent={RED} cat="Writing & Poetry">
          <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.05, color: INK }}>O Captain! My Captain!</div>
          <div style={{ marginTop: 10, fontSize: 25, color: INK, lineHeight: 1.3 }}>The ship has weathered every rack, the prize we sought is won…</div>
          <Byline letter="M" color={RED} name="Margin Books" handle="margin" /><ActionRow />
        </FeedCard>
        <FeedCard accent={BLUE} cat="Visual Art">
          <div style={{ position: "relative", background: INK, marginBottom: 14 }}>
            <Img src={staticFile(PAINTINGS[0])} style={{ width: "100%", height: 360, objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", top: 14, right: 14, border: `3px solid ${INK}`, background: PAPER, padding: "6px 12px", fontSize: 22, fontWeight: 700 }}>3/5</div>
          </div>
          <div style={{ fontSize: 25, color: INK }}>Starry night, in motion.</div>
          <Byline letter="C" color={INK} name="Cris" handle="cris" /><ActionRow />
        </FeedCard>
        <FeedCard accent={YELLOW} cat="Music">
          <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.05, color: INK }}>Nocturne Sessions — new EP</div>
          <div style={{ marginTop: 10, fontSize: 25, color: INK }}>Six tracks recorded live. Listen through, then find it on Astelier.</div>
          <Byline letter="A" color={YELLOW} name="Aurora Editions" handle="aurora" /><ActionRow />
        </FeedCard>
        <FeedCard accent={BLUE} cat="Film">
          <div style={{ position: "relative", background: INK, marginBottom: 14 }}>
            <Img src={staticFile(PAINTINGS[3])} style={{ width: "100%", height: 360, objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", bottom: 14, left: 14, border: `3px solid ${PAPER}`, color: PAPER, padding: "6px 12px", fontSize: 22, fontWeight: 700 }}>▶ 1:12</div>
          </div>
          <div style={{ fontSize: 25, color: INK }}>Teaser — one long take.</div>
          <Byline letter="K" color={BLUE} name="Kino Verde" handle="kinoverde" /><ActionRow />
        </FeedCard>
        <FeedCard accent={RED} cat="Photography">
          <div style={{ position: "relative", background: INK, marginBottom: 14 }}>
            <Img src={staticFile(PAINTINGS[1])} style={{ width: "100%", height: 360, objectFit: "cover", display: "block" }} />
          </div>
          <div style={{ fontSize: 25, color: INK }}>Salt &amp; light.</div>
          <Byline letter="C" color={RED} name="Cris" handle="cris" /><ActionRow />
        </FeedCard>
        <FeedCard accent={YELLOW} cat="Handmade">
          <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.05, color: INK }}>Risograph set — 12 prints</div>
          <div style={{ marginTop: 10, fontSize: 25, color: INK }}>Hand-pulled, numbered. New drop in the shop this week.</div>
          <Byline letter="A" color={INK} name="Atrium" handle="atrium" /><ActionRow />
        </FeedCard>
      </div>
      <Strip f={f} delay={16} color={BLUE}>In order. Everyone who follows you — no ads.</Strip>
      <BottomNav tabs={ATELIER_TABS} active={0} />
    </AbsoluteFill>
  );
};

// Real publish form (mirrors the app: segmented type, choose files, alt text,
// caption, ✨ auto-detect category, tags).
const Composer: React.FC<{ len: number }> = () => {
  const f = useCurrentFrame();
  const FLabel: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => (
    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: INK, opacity: fade(f, d) }}>{children}</div>
  );
  const FBox: React.FC<{ d: number; h?: number; children: React.ReactNode }> = ({ d, h, children }) => (
    <div style={{ border: `3px solid ${INK}`, background: PAPER, padding: "16px 18px", fontSize: 26, color: MUTE, marginTop: 12, minHeight: h, opacity: fade(f, d) }}>{children}</div>
  );
  const seg = ["Image", "Short video", "Short audio", "Text"];
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `4px solid ${INK}`, padding: "26px 40px", background: PAPER }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}><MiniMarks /><span style={{ fontSize: 40, fontWeight: 700, letterSpacing: 2, color: INK }}>ATELIER</span></div>
        <span style={{ border: `3px solid ${INK}`, padding: "10px 20px", fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: INK }}>Profile</span>
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 150 }}>
        <Window title="Publish work" accent={RED}>
          <FLabel d={4}>What are you sharing?</FLabel>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "14px 0 26px" }}>
            {seg.map((s, i) => <span key={s} style={{ border: `3px solid ${INK}`, padding: "12px 18px", fontSize: 23, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: i === 0 ? INK : PAPER, color: i === 0 ? PAPER : INK, opacity: fade(f, 8 + i * 4) }}>{s}</span>)}
          </div>
          <FLabel d={16}>Work — up to 10 images</FLabel>
          <div style={{ display: "flex", alignItems: "center", border: `3px solid ${INK}`, marginTop: 12, opacity: fade(f, 18) }}>
            <span style={{ background: INK, color: PAPER, padding: "16px 22px", fontSize: 23, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Choose files</span>
            <span style={{ padding: "16px 20px", fontSize: 26, color: MUTE }}>No file chosen</span>
          </div>
          <div style={{ marginTop: 14, fontSize: 22, color: MUTE, lineHeight: 1.3, opacity: fade(f, 22) }}>Your original is stored untouched, full resolution. Optimized display copies are generated for fast viewing.</div>
          <div style={{ marginTop: 24 }}><FLabel d={26}>Alt text (describe the work for screen readers)</FLabel><FBox d={28}>e.g. Wood-fired tea bowl with iron glaze, kiln scars</FBox></div>
          <div style={{ marginTop: 22 }}><FLabel d={30}>Caption</FLabel><FBox d={32} h={110}>Say something about the work…</FBox></div>
          <div style={{ marginTop: 22 }}><FLabel d={34}>Category</FLabel>
            <div style={{ border: `3px solid ${INK}`, padding: "16px 20px", marginTop: 12, fontSize: 26, color: INK, display: "flex", justifyContent: "space-between", opacity: fade(f, 36) }}><span>✨ Auto-detect (or choose)</span><span style={{ color: MUTE }}>▾</span></div>
          </div>
          <div style={{ marginTop: 22 }}><FLabel d={38}>Tags (optional)</FLabel><FBox d={40}>woodfired, ceramics, studio</FBox></div>
        </Window>
      </div>
      <BottomNav tabs={ATELIER_TABS} active={-1} />
    </AbsoluteFill>
  );
};

const Painting: React.FC<{ src: string; from: number; dur: number; f: number }> = ({ src, from, dur, f }) => {
  const scale = interpolate(f, [from, from + dur], [1.1, 1.26], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tx = interpolate(f, [from, from + dur], [-24, 24], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = interpolate(f, [from, from + 12, from + dur - 12, from + dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: op }}><Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale}) translateX(${tx}px)` }} /></AbsoluteFill>;
};

const Heroes: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const hrs = 24 - Math.floor(interpolate(f, [0, len], [0, 3], { extrapolateRight: "clamp" }));
  return (
    <AbsoluteFill style={{ background: INK }}>
      <Painting src={PAINTINGS[0]} from={0} dur={Math.round(len * 0.62)} f={f} />
      <Painting src={PAINTINGS[3]} from={Math.round(len * 0.52)} dur={Math.round(len * 0.55)} f={f} />
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.78) 100%)" }} />
      <div style={{ position: "absolute", top: 70, right: 56, border: `3px solid ${PAPER}`, color: PAPER, padding: "10px 18px", fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>⏳ {hrs}H</div>
      <div style={{ position: "absolute", top: 70, left: 56, border: `3px solid ${PAPER}`, color: PAPER, padding: "10px 18px", fontSize: 26, fontWeight: 700, letterSpacing: 1, opacity: fade(f, 6) }}>◆ Nocturne · event</div>
      <div style={{ position: "absolute", right: 56, bottom: 360, color: PAPER, textAlign: "center", opacity: fade(f, 18) }}><div style={{ fontSize: 60, color: RED }}>♥</div><div style={{ fontSize: 30, fontWeight: 700 }}>128</div></div>
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 150, opacity: fade(f, 10), transform: `translateY(${rise(f, 10)}px)` }}>
        <div style={{ width: 54, height: 54, background: YELLOW, marginBottom: 24 }} />
        <div style={{ fontSize: 76, fontWeight: 700, color: PAPER, lineHeight: 1.02, letterSpacing: -1 }}>Heroes —<br /><span style={{ color: YELLOW }}>just for one day.</span></div>
        <div style={{ marginTop: 18, fontSize: 34, color: PAPER, opacity: 0.9, lineHeight: 1.2 }}>Tied to the events you attend.</div>
      </div>
    </AbsoluteFill>
  );
};

const Roles: React.FC<{ len: number }> = () => {
  const f = useCurrentFrame();
  const rows = [
    { c: RED, t: "Member", d: "Browse, follow, join groups. Free." },
    { c: BLUE, t: "Creator", d: "Approved to publish work + open groups." },
    { c: YELLOW, t: "Curator", d: "Earned. Reposts & surfaces quality. ♺ ✦" },
  ];
  return (
    <AbsoluteFill style={{ background: PAPER, padding: "110px 64px 0" }}>
      <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1, color: INK, marginBottom: 34, opacity: fade(f, 2) }}>Three ways to belong</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {rows.map((r, i) => (
          <div key={r.t} style={{ border: `4px solid ${INK}`, background: PAPER, padding: "20px 24px", opacity: fade(f, 10 + i * 16), transform: `translateX(${interpolate(fade(f, 10 + i * 16), [0, 1], [-40, 0])}px)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}><div style={{ width: 30, height: 30, background: r.c }} /><span style={{ fontSize: 40, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: INK }}>{r.t}</span></div>
            <div style={{ marginTop: 10, fontSize: 30, color: INK }}>{r.d}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 30, fontSize: 34, fontWeight: 700, color: BLUE, opacity: fade(f, 66) }}>+ real moderation — quality, not spam.</div>
    </AbsoluteFill>
  );
};

const GroupCard: React.FC<{ f: number; delay: number; accent: string; name: string; follows: string; cat: string; members: number; followers: number; joined: boolean }> = ({ f, delay, accent, name, follows, cat, members, followers, joined }) => (
  <div style={{ border: `4px solid ${INK}`, background: PAPER, opacity: fade(f, delay), transform: `translateY(${rise(f, delay, 40)}px)` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: `4px solid ${INK}`, padding: "14px 20px" }}><div style={{ width: 22, height: 22, background: accent }} /><span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Group</span></div>
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.05, color: INK, textTransform: "uppercase" }}>{name} — community</div>
      <div style={{ marginTop: 12, fontSize: 24, color: INK }}>Open group for people who follow {follows}.</div>
      <div style={{ marginTop: 16 }}><Chip>{cat}</Chip></div>
      <div style={{ marginTop: 16, fontSize: 20, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: INK }}>{members} members · {followers} followers</div>
      <div style={{ display: "flex", gap: 14, marginTop: 16 }}><Chip solid={!joined}>{joined ? "Following" : "Follow"}</Chip><Chip>Open group →</Chip></div>
    </div>
  </div>
);

const Groups: React.FC<{ len: number }> = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: PAPER, padding: "70px 48px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <GroupCard f={f} delay={4} accent={BLUE} name="Kino Verde" follows="Kino Verde" cat="Film" members={1} followers={1} joined />
        <GroupCard f={f} delay={14} accent={YELLOW} name="Aurora Editions" follows="Aurora Editions" cat="Music" members={1} followers={0} joined={false} />
      </div>
      <Strip f={f} delay={22} color={YELLOW}><span style={{ color: INK }}>Gather around what you love.</span></Strip>
      <BottomNav tabs={ATELIER_TABS} active={2} />
    </AbsoluteFill>
  );
};

const Astelier: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const imgs = [PAINTINGS[1], PAINTINGS[2], PAINTINGS[3], PAINTINGS[0]];
  const titles = ["Risograph Poster", "Ceramic Study", "Gold Leaf Print", "Night Study"];
  const cols = [RED, BLUE, YELLOW, INK];
  const scroll = interpolate(f, [24, len - 12], [0, -170], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <div style={{ position: "absolute", left: 48, right: 48, top: 56, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3, background: PAPER, paddingBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}><MiniMarks /><span style={{ fontSize: 44, fontWeight: 700, letterSpacing: 2, color: INK }}>ASTELIER</span></div>
        <Chip>0% FEE</Chip>
      </div>
      <div style={{ position: "absolute", left: 48, right: 48, top: 150, transform: `translateY(${scroll}px)`, opacity: fade(f, 6) }}>
        <div style={{ border: `4px solid ${INK}` }}>
          <div style={{ height: 190, background: YELLOW }} />
          <div style={{ padding: 24, borderTop: `4px solid ${INK}` }}><div style={{ fontSize: 48, fontWeight: 700, color: INK }}>KINO VERDE SHOP</div><div style={{ marginTop: 10, fontSize: 26, color: INK }}>Merch, posters &amp; books from the studio.</div></div>
        </div>
        <div style={{ marginTop: 22, fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: MUTE }}>Catalog</div>
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {imgs.map((src, i) => (
            <div key={i} style={{ border: `4px solid ${INK}`, opacity: fade(f, 12 + i * 4) }}>
              <Img src={staticFile(src)} style={{ width: "100%", height: 190, objectFit: "cover", display: "block" }} />
              <div style={{ padding: "14px 16px", borderTop: `4px solid ${INK}` }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: INK }}>{titles[i]}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}><span style={{ fontSize: 26, fontWeight: 700, color: INK }}>${18 + i * 9}</span><span style={{ fontSize: 22, fontWeight: 700, color: cols[i] }}>Buy →</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Strip f={f} delay={18} color={RED}>Your own shop — Buy → sends buyers to you.</Strip>
      <BottomNav tabs={ASTELIER_TABS} active={0} />
    </AbsoluteFill>
  );
};

const Values: React.FC<{ len: number }> = () => {
  const f = useCurrentFrame();
  const rows = [
    { t: "Funded by donations.", c: BLUE },
    { t: "Led by people from the arts.", c: INK },
    { t: "Never by ads.", c: RED },
  ];
  return (
    <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "center", padding: 72 }}>
      {rows.map((r, i) => <div key={r.t} style={{ fontSize: 72, fontWeight: 700, color: r.c, lineHeight: 1.14, letterSpacing: -1, opacity: fade(f, 6 + i * 20), transform: `translateX(${interpolate(fade(f, 6 + i * 20), [0, 1], [-40, 0])}px)` }}>{r.t}</div>)}
      <div style={{ display: "flex", gap: 20, marginTop: 48, opacity: fade(f, 74) }}><Mark kind="square" color={RED} size={40} /><Mark kind="diamond" color={BLUE} size={34} /><Mark kind="circle" color={YELLOW} size={40} /></div>
    </AbsoluteFill>
  );
};

const CTA: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Marks f={f} size={104} gap={34} />
      <div style={{ marginTop: 54, fontSize: 70, fontWeight: 700, letterSpacing: 4, color: INK, opacity: fade(f, 18) }}>À UN FLÂNEUR</div>
      <div style={{ marginTop: 30, border: `4px solid ${INK}`, background: INK, color: PAPER, padding: "20px 40px", fontSize: 40, fontWeight: 700, letterSpacing: 1, opacity: fade(f, 32), transform: `scale(${interpolate(fade(f, 32), [0, 1], [0.9, 1])})` }}>atelier.aunflaneur.com</div>
    </AbsoluteFill>
  );
};

// bg lets full-bleed dark scenes (Heroes) stay dark while SceneWrap fades them.
const SCENES: { C: React.FC<{ len: number }>; bg?: string }[] = [
  { C: Message1 as React.FC<{ len: number }> },
  { C: Message2 as React.FC<{ len: number }> },
  { C: Feed },
  { C: Composer },
  { C: Heroes, bg: INK },
  { C: Roles },
  { C: Groups },
  { C: Astelier },
  { C: Values },
  { C: CTA as React.FC<{ len: number }> },
];

export const Promo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER, fontFamily }}>
    <Audio src={staticFile("audio/music.mp3")} volume={musicVol} loop />
    {SCENES.map(({ C, bg }, i) => (
      <Sequence key={i} from={STARTS[i]} durationInFrames={SCENE[i]}>
        <SceneWrap len={SCENE[i]} bg={bg}>
          <C len={SCENE[i]} />
        </SceneWrap>
        <Sequence from={LEAD}>
          <Audio src={staticFile(`audio/vo/${VO[i].f}.mp3`)} />
        </Sequence>
      </Sequence>
    ))}
  </AbsoluteFill>
);
