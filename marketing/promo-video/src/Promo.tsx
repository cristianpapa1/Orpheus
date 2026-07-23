import React, { createContext, useContext } from "react";
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
import { loadFont as loadGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadNoto } from "@remotion/google-fonts/NotoSans";
import { loadFont as loadJP } from "@remotion/google-fonts/NotoSansJP";
import { loadFont as loadSC } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadAR } from "@remotion/google-fonts/NotoSansArabic";
import { STRINGS, RTL, VOICE_BY_LOCALE, type Locale, type PromoStrings } from "./strings";
import { DURATIONS } from "./durations";

export const FPS = 30;

// Space Grotesk carries the brand (Latin). Noto covers scripts SG lacks, so
// CJK / Arabic / Cyrillic render as glyphs, not tofu. Latin brand words inside
// a non-Latin string still fall back to Grotesk first.
const grotesk = loadGrotesk().fontFamily;
const noto = loadNoto("normal", { weights: ["400", "700"] }).fontFamily;
const jp = loadJP("normal", { weights: ["400", "700"] }).fontFamily;
const sc = loadSC("normal", { weights: ["400", "700"] }).fontFamily;
const ar = loadAR("normal", { weights: ["400", "700"] }).fontFamily;
const FONT: Record<Locale, string> = {
  en: grotesk, fr: grotesk, pt: grotesk, de: grotesk, it: grotesk,
  ru: `${grotesk}, ${noto}`,
  ja: `${grotesk}, ${jp}`,
  zh: `${grotesk}, ${sc}`,
  ar: `${grotesk}, ${ar}`,
};

// ── brand ─────────────────────────────────────────────────────────
const PAPER = "#f5f3ec";
const INK = "#111111";
const BLUE = "#2145c9";
const RED = "#e1251b";
const YELLOW = "#f2b705";
const MUTE = "#8a877c";
const PAINTINGS = ["art/starry-night.jpg", "art/great-wave.jpg", "art/pearl-earring.jpg", "art/the-kiss.jpg"];

const fade = (f: number, d: number, dur = 16) => interpolate(f, [d, d + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rise = (f: number, d: number, dist = 60, dur = 20) => interpolate(f, [d, d + dur], [dist, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// strings context — scenes read the active locale's copy via useS()
const StrCtx = createContext<PromoStrings>(STRINGS.en);
const useS = () => useContext(StrCtx);

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
const ActionRow: React.FC = () => {
  const s = useS();
  return <div style={{ display: "flex", gap: 14, marginTop: 16 }}><Chip>♥ 0</Chip><Chip>⚠ 0</Chip><Chip>{s.act} ▾</Chip></div>;
};
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
      <div key={t.l + i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "20px 0", background: i === active ? INK : "transparent" }}>
        <div style={{ width: 16, height: 16, background: t.c }} />
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: i === active ? PAPER : INK }}>{t.l}</span>
      </div>
    ))}
  </div>
);
const useAtelierTabs = () => { const s = useS(); return [{ l: s.navFeed, c: RED }, { l: s.navHeroes, c: BLUE }, { l: s.navGroups, c: YELLOW }, { l: s.navChat, c: RED }]; };
const useAstelierTabs = () => { const s = useS(); return [{ l: s.navHome, c: RED }, { l: s.navBrowse, c: BLUE }, { l: s.navSearch, c: YELLOW }, { l: s.navSell, c: INK }]; };
const Strip: React.FC<{ f: number; delay: number; color: string; dark?: boolean; children: React.ReactNode }> = ({ f, delay, color, dark, children }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, background: color, padding: "20px 48px", opacity: fade(f, delay), zIndex: 3 }}>
    <span style={{ fontSize: 32, fontWeight: 700, color: dark ? INK : PAPER }}>{children}</span>
  </div>
);
const SceneWrap: React.FC<{ len: number; children: React.ReactNode; bg?: string }> = ({ len, children, bg }) => {
  const f = useCurrentFrame();
  const op = interpolate(f, [0, 8, len - 10, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: op, background: bg }}>{children}</AbsoluteFill>;
};

// ── Scenes ────────────────────────────────────────────────────────
const Message1: React.FC<{ len: number }> = () => {
  const f = useCurrentFrame();
  const s = useS();
  return (
    <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "center", padding: 80 }}>
      <div style={{ width: 54, height: 54, background: RED, marginBottom: 30, opacity: fade(f, 2) }} />
      <div style={{ fontSize: 62, fontWeight: 700, color: INK, lineHeight: 1.08, letterSpacing: -1, opacity: fade(f, 4), transform: `translateY(${rise(f, 4)}px)` }}>
        {s.m1a} <span style={{ color: RED }}>Instagram</span> &amp; <span style={{ color: RED }}>Amazon</span> {s.m1b}
      </div>
    </AbsoluteFill>
  );
};

const Message2: React.FC<{ len: number }> = () => {
  const f = useCurrentFrame();
  const s = useS();
  return (
    <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "center", padding: 80 }}>
      <div style={{ width: 54, height: 54, background: BLUE, marginBottom: 30, opacity: fade(f, 2) }} />
      <div style={{ fontSize: 60, fontWeight: 700, color: INK, lineHeight: 1.1, letterSpacing: -1, opacity: fade(f, 4), transform: `translateY(${rise(f, 4)}px)` }}>
        {s.m2a} <span style={{ color: BLUE }}>{s.m2mid}</span> {s.m2b}
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
  const s = useS();
  const scroll = interpolate(f, [10, len - 12], [0, -1180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <div style={{ position: "absolute", left: 48, right: 48, top: 56, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3, background: PAPER, paddingBottom: 14 }}>
        <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1, color: INK, textTransform: "uppercase" }}>{s.navFeed}</span>
        <div style={{ background: INK, color: PAPER, padding: "16px 24px", fontSize: 24, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>+ {s.newPost}</div>
      </div>
      <div style={{ position: "absolute", left: 48, right: 48, top: 150, transform: `translateY(${scroll}px)`, display: "flex", flexDirection: "column", gap: 28, opacity: fade(f, 4) }}>
        <FeedCard accent={RED} cat={s.catWriting}>
          <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.05, color: INK }}>{s.poemTitle}</div>
          <div style={{ marginTop: 10, fontSize: 25, color: INK, lineHeight: 1.3 }}>{s.poemBody}</div>
          <Byline letter="M" color={RED} name="Margin Books" handle="margin" /><ActionRow />
        </FeedCard>
        <FeedCard accent={BLUE} cat={s.catVisual}>
          <div style={{ position: "relative", background: INK, marginBottom: 14 }}>
            <Img src={staticFile(PAINTINGS[0])} style={{ width: "100%", height: 360, objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", top: 14, right: 14, border: `3px solid ${INK}`, background: PAPER, padding: "6px 12px", fontSize: 22, fontWeight: 700 }}>3/5</div>
          </div>
          <div style={{ fontSize: 25, color: INK }}>{s.capStarry}</div>
          <Byline letter="C" color={INK} name="Cris" handle="cris" /><ActionRow />
        </FeedCard>
        <FeedCard accent={YELLOW} cat={s.catMusic}>
          <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.05, color: INK }}>{s.musicTitle}</div>
          <div style={{ marginTop: 10, fontSize: 25, color: INK }}>{s.musicBody}</div>
          <Byline letter="A" color={YELLOW} name="Aurora Editions" handle="aurora" /><ActionRow />
        </FeedCard>
        <FeedCard accent={BLUE} cat={s.catFilm}>
          <div style={{ position: "relative", background: INK, marginBottom: 14 }}>
            <Img src={staticFile(PAINTINGS[3])} style={{ width: "100%", height: 360, objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", bottom: 14, left: 14, border: `3px solid ${PAPER}`, color: PAPER, padding: "6px 12px", fontSize: 22, fontWeight: 700 }}>▶ 1:12</div>
          </div>
          <div style={{ fontSize: 25, color: INK }}>{s.filmBody}</div>
          <Byline letter="K" color={BLUE} name="Kino Verde" handle="kinoverde" /><ActionRow />
        </FeedCard>
        <FeedCard accent={RED} cat={s.catPhoto}>
          <div style={{ position: "relative", background: INK, marginBottom: 14 }}>
            <Img src={staticFile(PAINTINGS[1])} style={{ width: "100%", height: 360, objectFit: "cover", display: "block" }} />
          </div>
          <div style={{ fontSize: 25, color: INK }}>{s.photoBody}</div>
          <Byline letter="C" color={RED} name="Cris" handle="cris" /><ActionRow />
        </FeedCard>
        <FeedCard accent={YELLOW} cat={s.catHandmade}>
          <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.05, color: INK }}>{s.handTitle}</div>
          <div style={{ marginTop: 10, fontSize: 25, color: INK }}>{s.handBody}</div>
          <Byline letter="A" color={INK} name="Atrium" handle="atrium" /><ActionRow />
        </FeedCard>
      </div>
      <Strip f={f} delay={16} color={BLUE}>{s.feedStrip}</Strip>
      <BottomNav tabs={useAtelierTabs()} active={0} />
    </AbsoluteFill>
  );
};

const Composer: React.FC<{ len: number }> = () => {
  const f = useCurrentFrame();
  const s = useS();
  const FLabel: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => (
    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: INK, opacity: fade(f, d) }}>{children}</div>
  );
  const FBox: React.FC<{ d: number; h?: number; children: React.ReactNode }> = ({ d, h, children }) => (
    <div style={{ border: `3px solid ${INK}`, background: PAPER, padding: "16px 18px", fontSize: 26, color: MUTE, marginTop: 12, minHeight: h, opacity: fade(f, d) }}>{children}</div>
  );
  const seg = [s.segImage, s.segVideo, s.segAudio, s.segText];
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `4px solid ${INK}`, padding: "26px 40px", background: PAPER }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}><MiniMarks /><span style={{ fontSize: 40, fontWeight: 700, letterSpacing: 2, color: INK }}>ATELIER</span></div>
        <span style={{ border: `3px solid ${INK}`, padding: "10px 20px", fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: INK }}>{s.profile}</span>
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 150 }}>
        <Window title={s.publishWork} accent={RED}>
          <FLabel d={4}>{s.whatSharing}</FLabel>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "14px 0 26px" }}>
            {seg.map((label, i) => <span key={i} style={{ border: `3px solid ${INK}`, padding: "12px 18px", fontSize: 23, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: i === 0 ? INK : PAPER, color: i === 0 ? PAPER : INK, opacity: fade(f, 8 + i * 4) }}>{label}</span>)}
          </div>
          <FLabel d={16}>{s.workImages}</FLabel>
          <div style={{ display: "flex", alignItems: "center", border: `3px solid ${INK}`, marginTop: 12, opacity: fade(f, 18) }}>
            <span style={{ background: INK, color: PAPER, padding: "16px 22px", fontSize: 23, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{s.chooseFiles}</span>
            <span style={{ padding: "16px 20px", fontSize: 26, color: MUTE }}>{s.noFile}</span>
          </div>
          <div style={{ marginTop: 14, fontSize: 22, color: MUTE, lineHeight: 1.3, opacity: fade(f, 22) }}>{s.originalNote}</div>
          <div style={{ marginTop: 24 }}><FLabel d={26}>{s.altLabel}</FLabel><FBox d={28}>{s.altPh}</FBox></div>
          <div style={{ marginTop: 22 }}><FLabel d={30}>{s.captionLabel}</FLabel><FBox d={32} h={110}>{s.captionPh}</FBox></div>
          <div style={{ marginTop: 22 }}><FLabel d={34}>{s.categoryLabel}</FLabel>
            <div style={{ border: `3px solid ${INK}`, padding: "16px 20px", marginTop: 12, fontSize: 26, color: INK, display: "flex", justifyContent: "space-between", opacity: fade(f, 36) }}><span>✨ {s.autoDetect}</span><span style={{ color: MUTE }}>▾</span></div>
          </div>
          <div style={{ marginTop: 22 }}><FLabel d={38}>{s.tagsLabel}</FLabel><FBox d={40}>{s.tagsPh}</FBox></div>
        </Window>
      </div>
      <BottomNav tabs={useAtelierTabs()} active={-1} />
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
  const s = useS();
  const hrs = 24 - Math.floor(interpolate(f, [0, len], [0, 3], { extrapolateRight: "clamp" }));
  return (
    <AbsoluteFill style={{ background: INK }}>
      <Painting src={PAINTINGS[0]} from={0} dur={Math.round(len * 0.62)} f={f} />
      <Painting src={PAINTINGS[3]} from={Math.round(len * 0.52)} dur={Math.round(len * 0.55)} f={f} />
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.78) 100%)" }} />
      <div style={{ position: "absolute", top: 70, right: 56, border: `3px solid ${PAPER}`, color: PAPER, padding: "10px 18px", fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>⏳ {hrs}H</div>
      <div style={{ position: "absolute", top: 70, left: 56, border: `3px solid ${PAPER}`, color: PAPER, padding: "10px 18px", fontSize: 26, fontWeight: 700, letterSpacing: 1, opacity: fade(f, 6) }}>◆ Nocturne · {s.heroEvent}</div>
      <div style={{ position: "absolute", right: 56, bottom: 360, color: PAPER, textAlign: "center", opacity: fade(f, 18) }}><div style={{ fontSize: 60, color: RED }}>♥</div><div style={{ fontSize: 30, fontWeight: 700 }}>128</div></div>
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 150, opacity: fade(f, 10), transform: `translateY(${rise(f, 10)}px)` }}>
        <div style={{ width: 54, height: 54, background: YELLOW, marginBottom: 24 }} />
        <div style={{ fontSize: 76, fontWeight: 700, color: PAPER, lineHeight: 1.02, letterSpacing: -1 }}>{s.hTitle1}<br /><span style={{ color: YELLOW }}>{s.hTitle2}</span></div>
        <div style={{ marginTop: 18, fontSize: 34, color: PAPER, opacity: 0.9, lineHeight: 1.2 }}>{s.hSub}</div>
      </div>
    </AbsoluteFill>
  );
};

const Events: React.FC<{ len: number }> = () => {
  const f = useCurrentFrame();
  const s = useS();
  return (
    <AbsoluteFill style={{ background: PAPER, padding: "60px 48px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ border: `4px solid ${INK}`, background: PAPER, opacity: fade(f, 2) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: `4px solid ${INK}`, padding: "14px 20px" }}><div style={{ width: 22, height: 22, background: RED }} /><span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{s.online}</span></div>
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.02, color: INK }}>Nocturne — {s.evtNight}</div>
            <div style={{ marginTop: 12, fontSize: 22, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: INK }}>Wed · 23 Jul 2026 · 20:00</div>
            <div style={{ marginTop: 8, fontSize: 24, color: MUTE }}>Aurora Editions · @aurora</div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 18, borderTop: `3px solid ${INK}`, paddingTop: 18 }}>
              <Chip solid>✓ {s.imGoing}</Chip>
              <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: INK }}>24 {s.going} · 2 {s.views}</span>
            </div>
          </div>
        </div>
        <div style={{ border: `4px solid ${INK}`, background: PAPER, opacity: fade(f, 16) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: `4px solid ${INK}`, padding: "14px 20px" }}><div style={{ width: 22, height: 22, background: BLUE }} /><span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{s.hFromEvent}</span></div>
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 26, color: INK, lineHeight: 1.3 }}>{s.hFromEventBody}</div>
            <div style={{ marginTop: 16 }}><Chip solid>+ {s.postHero}</Chip></div>
          </div>
        </div>
        <div style={{ border: `4px solid ${INK}`, background: PAPER, opacity: fade(f, 30) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: `4px solid ${INK}`, padding: "14px 20px" }}><div style={{ width: 22, height: 22, background: YELLOW }} /><span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{s.attendees}</span></div>
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 24, color: INK, lineHeight: 1.3 }}>{s.attendeesBody}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18, border: `3px solid ${INK}`, padding: "14px 18px", flexWrap: "wrap" }}>
              <Avatar letter="M" color={INK} size={40} />
              <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: INK }}>{s.memberRole} · @member</span>
              <span style={{ marginLeft: "auto", fontSize: 22, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: BLUE }}>✓ {s.confirmed}</span>
            </div>
          </div>
        </div>
      </div>
      <BottomNav tabs={useAtelierTabs()} active={1} />
    </AbsoluteFill>
  );
};

const Roles: React.FC<{ len: number }> = () => {
  const f = useCurrentFrame();
  const s = useS();
  const rows = [
    { c: RED, t: s.rMember, d: s.rMemberD },
    { c: BLUE, t: s.rCreator, d: s.rCreatorD },
    { c: YELLOW, t: s.rCurator, d: s.rCuratorD },
  ];
  return (
    <AbsoluteFill style={{ background: PAPER, padding: "110px 64px 0" }}>
      <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1, color: INK, marginBottom: 34, opacity: fade(f, 2) }}>{s.rolesTitle}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ border: `4px solid ${INK}`, background: PAPER, padding: "20px 24px", opacity: fade(f, 10 + i * 16), transform: `translateX(${interpolate(fade(f, 10 + i * 16), [0, 1], [-40, 0])}px)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}><div style={{ width: 30, height: 30, background: r.c }} /><span style={{ fontSize: 40, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: INK }}>{r.t}</span></div>
            <div style={{ marginTop: 10, fontSize: 30, color: INK }}>{r.d}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 30, fontSize: 34, fontWeight: 700, color: BLUE, opacity: fade(f, 66) }}>{s.moderation}</div>
    </AbsoluteFill>
  );
};

const GroupCard: React.FC<{ f: number; delay: number; accent: string; name: string; cat: string; members: number; followers: number; joined: boolean }> = ({ f, delay, accent, name, cat, members, followers, joined }) => {
  const s = useS();
  return (
    <div style={{ border: `4px solid ${INK}`, background: PAPER, opacity: fade(f, delay), transform: `translateY(${rise(f, delay, 40)}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: `4px solid ${INK}`, padding: "14px 20px" }}><div style={{ width: 22, height: 22, background: accent }} /><span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{s.groupTag}</span></div>
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.05, color: INK, textTransform: "uppercase" }}>{name} — {s.community}</div>
        <div style={{ marginTop: 12, fontSize: 24, color: INK }}>{s.openFor} {name}.</div>
        <div style={{ marginTop: 16 }}><Chip>{cat}</Chip></div>
        <div style={{ marginTop: 16, fontSize: 20, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: INK }}>{members} {s.members} · {followers} {s.followers}</div>
        <div style={{ display: "flex", gap: 14, marginTop: 16 }}><Chip solid={!joined}>{joined ? s.following : s.follow}</Chip><Chip>{s.openGroup}</Chip></div>
      </div>
    </div>
  );
};

const Groups: React.FC<{ len: number }> = () => {
  const f = useCurrentFrame();
  const s = useS();
  return (
    <AbsoluteFill style={{ background: PAPER, padding: "70px 48px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <GroupCard f={f} delay={4} accent={BLUE} name="Kino Verde" cat={s.catFilm} members={1} followers={1} joined />
        <GroupCard f={f} delay={14} accent={YELLOW} name="Aurora Editions" cat={s.catMusic} members={1} followers={0} joined={false} />
      </div>
      <Strip f={f} delay={22} color={YELLOW} dark>{s.groupsStrip}</Strip>
      <BottomNav tabs={useAtelierTabs()} active={2} />
    </AbsoluteFill>
  );
};

const GroupMini: React.FC<{ f: number; delay: number; accent: string; name: string; cat: string }> = ({ f, delay, accent, name, cat }) => {
  const s = useS();
  return (
    <div style={{ border: `3px solid ${INK}`, background: PAPER, opacity: fade(f, delay) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: `3px solid ${INK}`, padding: "10px 14px" }}><div style={{ width: 16, height: 16, background: accent }} /><span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{s.groupTag}</span></div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.05, color: INK, textTransform: "uppercase" }}>{name} — {s.community}</div>
        <div style={{ marginTop: 8, fontSize: 17, color: INK, lineHeight: 1.25 }}>{s.openFor} {name}.</div>
        <div style={{ marginTop: 12, display: "inline-block", border: `2px solid ${INK}`, padding: "4px 10px", fontSize: 15, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{cat}</div>
      </div>
    </div>
  );
};

const WebMobile: React.FC<{ len: number }> = () => {
  const f = useCurrentFrame();
  const s = useS();
  const groups = [
    { a: RED, n: "Margin Books", c: s.catWriting },
    { a: BLUE, n: "Kino Verde", c: s.catFilm },
    { a: YELLOW, n: "Aurora Editions", c: s.catMusic },
    { a: RED, n: "Atrium", c: s.catVisual },
    { a: BLUE, n: "Verso Press", c: s.catWriting },
    { a: YELLOW, n: "Nocturne Club", c: s.catFilm },
  ];
  const dot = (c: string) => <div style={{ width: 18, height: 18, borderRadius: "50%", background: c }} />;
  const rise2 = interpolate(fade(f, 6), [0, 1], [40, 0]);
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <div style={{ position: "absolute", left: 64, right: 64, top: 70, opacity: fade(f, 2) }}>
        <div style={{ width: 54, height: 54, background: BLUE, marginBottom: 20 }} />
        <div style={{ fontSize: 58, fontWeight: 700, letterSpacing: -1, color: INK, lineHeight: 1.05 }}>{s.webT1}<br />{s.webT2}</div>
      </div>
      <div style={{ position: "absolute", left: 50, right: 50, top: 320, border: `4px solid ${INK}`, background: PAPER, opacity: fade(f, 6), transform: `translateY(${rise2}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: `4px solid ${INK}`, padding: "14px 20px" }}>
          {dot(RED)}{dot(YELLOW)}{dot("#5aa469")}
          <div style={{ flex: 1, marginLeft: 14, border: `3px solid ${INK}`, borderRadius: 999, padding: "8px 20px", fontSize: 22, color: MUTE, textAlign: "center" }}>atelier.aunflaneur.com</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `4px solid ${INK}`, padding: "16px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}><MiniMarks /><span style={{ fontSize: 30, fontWeight: 700, letterSpacing: 2, color: INK }}>ATELIER</span></div>
          <div style={{ display: "flex", gap: 22, fontSize: 18, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: INK }}><span>{s.navFeed}</span><span>{s.navHeroes}</span><span style={{ borderBottom: `3px solid ${INK}` }}>{s.navGroups}</span><span>{s.navChat}</span></div>
          <span style={{ border: `3px solid ${INK}`, padding: "8px 16px", fontSize: 18, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{s.profile}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, padding: 22 }}>
          {groups.map((g, i) => <GroupMini key={g.n} f={f} delay={12 + i * 3} accent={g.a} name={g.n} cat={g.c} />)}
        </div>
      </div>
      <div style={{ position: "absolute", right: 70, top: 760, width: 320, border: `5px solid ${INK}`, borderRadius: 34, background: PAPER, overflow: "hidden", boxShadow: "-16px 16px 0 rgba(17,17,17,0.12)", opacity: fade(f, 20), transform: `translateY(${interpolate(fade(f, 20), [0, 1], [50, 0])}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: `3px solid ${INK}`, padding: "16px 16px 12px" }}><MiniMarks /><span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1, color: INK }}>ATELIER</span></div>
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {[{ a: RED, t: s.catWriting }, { a: BLUE, t: s.catVisual }].map((c, i) => (
            <div key={i} style={{ border: `3px solid ${INK}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: `3px solid ${INK}`, padding: "8px 10px" }}><div style={{ width: 12, height: 12, background: c.a }} /><span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{c.t}</span></div>
              <div style={{ height: 90, background: c.a === RED ? "#efe9dc" : INK }} />
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: `3px solid ${INK}` }}>
          {[RED, BLUE, YELLOW, RED].map((c, i) => <div key={i} style={{ display: "grid", placeItems: "center", padding: "12px 0", background: i === 2 ? INK : "transparent" }}><div style={{ width: 12, height: 12, background: c }} /></div>)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Astelier: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const s = useS();
  const imgs = [PAINTINGS[1], PAINTINGS[2], PAINTINGS[3], PAINTINGS[0]];
  const titles = [s.prodRiso, s.prodCeramic, s.prodGold, s.prodNight];
  const cols = [RED, BLUE, YELLOW, INK];
  const scroll = interpolate(f, [24, len - 12], [0, -170], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <div style={{ position: "absolute", left: 48, right: 48, top: 56, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3, background: PAPER, paddingBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}><MiniMarks /><span style={{ fontSize: 44, fontWeight: 700, letterSpacing: 2, color: INK }}>ASTELIER</span></div>
        <Chip>{s.fee}</Chip>
      </div>
      <div style={{ position: "absolute", left: 48, right: 48, top: 150, transform: `translateY(${scroll}px)`, opacity: fade(f, 6) }}>
        <div style={{ border: `4px solid ${INK}` }}>
          <div style={{ height: 190, background: YELLOW }} />
          <div style={{ padding: 24, borderTop: `4px solid ${INK}` }}><div style={{ fontSize: 48, fontWeight: 700, color: INK }}>KINO VERDE SHOP</div><div style={{ marginTop: 10, fontSize: 26, color: INK }}>{s.shopDesc}</div></div>
        </div>
        <div style={{ marginTop: 22, fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: MUTE }}>{s.catalog}</div>
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {imgs.map((src, i) => (
            <div key={i} style={{ border: `4px solid ${INK}`, opacity: fade(f, 12 + i * 4) }}>
              <Img src={staticFile(src)} style={{ width: "100%", height: 190, objectFit: "cover", display: "block" }} />
              <div style={{ padding: "14px 16px", borderTop: `4px solid ${INK}` }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: INK }}>{titles[i]}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}><span style={{ fontSize: 26, fontWeight: 700, color: INK }}>${18 + i * 9}</span><span style={{ fontSize: 22, fontWeight: 700, color: cols[i] }}>{s.buy} →</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Strip f={f} delay={18} color={RED}>{s.astelierStrip}</Strip>
      <BottomNav tabs={useAstelierTabs()} active={0} />
    </AbsoluteFill>
  );
};

const Values: React.FC<{ len: number }> = () => {
  const f = useCurrentFrame();
  const s = useS();
  const rows = [
    { t: s.valDonations, c: BLUE },
    { t: s.valArts, c: INK },
    { t: s.valAds, c: RED },
  ];
  return (
    <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "center", padding: 72 }}>
      {rows.map((r, i) => <div key={i} style={{ fontSize: 72, fontWeight: 700, color: r.c, lineHeight: 1.14, letterSpacing: -1, opacity: fade(f, 6 + i * 20), transform: `translateX(${interpolate(fade(f, 6 + i * 20), [0, 1], [-40, 0])}px)` }}>{r.t}</div>)}
      <div style={{ display: "flex", gap: 20, marginTop: 48, opacity: fade(f, 74) }}><Mark kind="square" color={RED} size={40} /><Mark kind="diamond" color={BLUE} size={34} /><Mark kind="circle" color={YELLOW} size={40} /></div>
    </AbsoluteFill>
  );
};

const CTA: React.FC<{ len: number }> = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Marks f={f} size={104} gap={34} />
      <div style={{ marginTop: 54, fontSize: 70, fontWeight: 700, letterSpacing: 4, color: INK, opacity: fade(f, 18) }}>À UN FLÂNEUR</div>
      <div style={{ marginTop: 30, border: `4px solid ${INK}`, background: INK, color: PAPER, padding: "20px 40px", fontSize: 40, fontWeight: 700, letterSpacing: 1, opacity: fade(f, 32), transform: `scale(${interpolate(fade(f, 32), [0, 1], [0.9, 1])})` }}>atelier.aunflaneur.com</div>
    </AbsoluteFill>
  );
};

// ── timing (per locale, from narration durations) ─────────────────
const LEAD = 6;
const TAIL = 12;
const SCENE_META: { C: React.FC<{ len: number }>; f: string; bg?: string }[] = [
  { C: Message1, f: "01" },
  { C: Message2, f: "02" },
  { C: Feed, f: "03" },
  { C: Composer, f: "04" },
  { C: Heroes, f: "05", bg: INK },
  { C: Events, f: "11" },
  { C: Roles, f: "06" },
  { C: Groups, f: "07" },
  { C: Astelier, f: "08" },
  { C: WebMobile, f: "12" },
  { C: Values, f: "09" },
  { C: CTA, f: "10" },
];

const dur = (locale: Locale, f: string) => (DURATIONS[locale]?.[f] ?? DURATIONS.en[f]);
export const sceneFrames = (locale: Locale) => SCENE_META.map((m) => LEAD + Math.ceil(dur(locale, m.f) * FPS) + TAIL);
export const promoDuration = (locale: Locale) => sceneFrames(locale).reduce((a, b) => a + b, 0);

const musicVol = (total: number) => (f: number) => {
  const inV = interpolate(f, [0, 24], [0, 0.14], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outV = interpolate(f, [total - 36, total], [0.14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return Math.min(inV, outV);
};

export const Promo: React.FC<{ locale?: Locale }> = ({ locale = "en" }) => {
  const s = STRINGS[locale] ?? STRINGS.en;
  const frames = sceneFrames(locale);
  const starts = frames.map((_, i) => frames.slice(0, i).reduce((a, b) => a + b, 0));
  const total = promoDuration(locale);
  return (
    <StrCtx.Provider value={s}>
      <AbsoluteFill style={{ backgroundColor: PAPER, fontFamily: FONT[locale], direction: RTL.includes(locale) ? "rtl" : "ltr" }}>
        <Audio src={staticFile("audio/music.mp3")} volume={musicVol(total)} loop />
        {SCENE_META.map((m, i) => (
          <Sequence key={i} from={starts[i]} durationInFrames={frames[i]}>
            <SceneWrap len={frames[i]} bg={m.bg}>
              <m.C len={frames[i]} />
            </SceneWrap>
            <Sequence from={LEAD}>
              <Audio src={staticFile(`audio/vo/${locale}/${m.f}.mp3`)} />
            </Sequence>
          </Sequence>
        ))}
      </AbsoluteFill>
    </StrCtx.Provider>
  );
};
