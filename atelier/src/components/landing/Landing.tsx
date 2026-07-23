"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, type Variants } from "framer-motion";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export interface StripItem {
  id: string;
  src: string;
  alt: string;
  author: string;
}

const reveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] } },
};

/** Scroll-triggered reveal that respects reduced-motion (renders in place). */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

interface DriftSpec {
  sizeFrac: number; // square/circle/triangle: size as a fraction of the box
  wFrac?: number; // line: width fraction (overrides sizeFrac for width)
  hPx?: number; // line: height in px
  start: { x: number; y: number }; // initial position as a fraction (0..1) of free space
  vx: number;
  vy: number; // drift velocity, px per ~60fps frame
  className: string;
  style?: CSSProperties;
}

/** One endlessly-drifting mark. Velocity is integrated each frame and bounces off
 *  the box walls. Draggable — while held, its OWN drift pauses (others keep going);
 *  release imparts a gentle fling that decays back into the drift. */
function DriftShape({
  spec,
  box,
  bounds,
  reduce,
  index,
}: {
  spec: DriftSpec;
  box: { w: number; h: number };
  bounds: RefObject<HTMLDivElement | null>;
  reduce: boolean | null;
  index: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const vel = useRef({ x: spec.vx, y: spec.vy });
  const dragging = useRef(false);
  const placed = useRef(false);

  const w = (spec.wFrac ?? spec.sizeFrac) * box.w;
  const h = spec.hPx ?? spec.sizeFrac * box.h;
  const maxX = Math.max(0, box.w - w);
  const maxY = Math.max(0, box.h - h);

  // Place the shape once the box has been measured.
  useEffect(() => {
    if (box.w === 0 || placed.current) return;
    x.set(spec.start.x * maxX);
    y.set(spec.start.y * maxY);
    placed.current = true;
  }, [box.w, box.h, maxX, maxY, spec.start.x, spec.start.y, x, y]);

  useAnimationFrame((_, delta) => {
    if (reduce || dragging.current || box.w === 0) return;
    const f = Math.min(3, delta / 16.667); // frame-rate independent; clamp long gaps
    let nx = x.get() + vel.current.x * f;
    let ny = y.get() + vel.current.y * f;
    if (nx <= 0) { nx = 0; vel.current.x = Math.abs(vel.current.x); }
    else if (nx >= maxX) { nx = maxX; vel.current.x = -Math.abs(vel.current.x); }
    if (ny <= 0) { ny = 0; vel.current.y = Math.abs(vel.current.y); }
    else if (ny >= maxY) { ny = maxY; vel.current.y = -Math.abs(vel.current.y); }
    x.set(nx);
    y.set(ny);
  });

  return (
    <motion.div
      drag
      dragConstraints={bounds}
      dragElastic={0.15}
      onDragStart={() => {
        dragging.current = true;
      }}
      onDragEnd={(_, info) => {
        dragging.current = false;
        // Turn the release velocity into a gentle drift (scaled + capped).
        const s = 0.012, cap = 1.6;
        const fx = Math.max(-cap, Math.min(cap, info.velocity.x * s));
        const fy = Math.max(-cap, Math.min(cap, info.velocity.y * s));
        if (Math.abs(fx) > 0.05) vel.current.x = fx;
        if (Math.abs(fy) > 0.05) vel.current.y = fy;
      }}
      whileDrag={{ scale: 1.12, zIndex: 20 }}
      whileHover={reduce ? undefined : { scale: 1.06 }}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{ x, y, ...spec.style }}
      className={spec.className}
    />
  );
}

/** Interactive hero composition — four marks drift slowly and endlessly, bouncing
 *  off the edges. Grab any one and the rest keep moving; let go and it eases back
 *  into the drift. A quiet, living toy: this is a place where you make things. */
function HeroMark() {
  const reduce = useReducedMotion();
  const bounds = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = bounds.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const grab = "absolute left-0 top-0 cursor-grab touch-none active:cursor-grabbing";
  const specs: DriftSpec[] = [
    { sizeFrac: 0.3, start: { x: 0.05, y: 0.1 }, vx: 0.33, vy: 0.24, className: `${grab} size-[30%] bg-red` },
    { sizeFrac: 0.28, start: { x: 0.8, y: 0.06 }, vx: -0.28, vy: 0.36, className: `${grab} size-[28%] rounded-full bg-blue` },
    { sizeFrac: 0.32, start: { x: 0.62, y: 0.66 }, vx: -0.34, vy: -0.26, className: `${grab} size-[32%] bg-yellow`, style: { clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" } },
    { sizeFrac: 0, wFrac: 0.6, hPx: 6, start: { x: 0.08, y: 0.9 }, vx: 0.3, vy: -0.3, className: `${grab} h-[6px] w-[60%] origin-center bg-ink`, style: { rotate: "-42deg" } },
  ];

  return (
    <div ref={bounds} aria-hidden title="Play with me" className="relative h-full w-full select-none">
      {specs.map((spec, i) => (
        <DriftShape key={i} spec={spec} box={box} bounds={bounds} reduce={reduce} index={i} />
      ))}
    </div>
  );
}

const NAV_LINK =
  "border-2 border-ink px-5 py-2 text-caption font-bold uppercase transition-colors";

export function Landing({
  strip,
  configured,
  L,
  footer,
  signIn,
}: {
  strip: StripItem[];
  configured: boolean;
  L: Dictionary["landing"];
  footer: Dictionary["footer"];
  signIn: string;
}) {
  const reduce = useReducedMotion();
  // Duplicate the strip so the marquee loops seamlessly; enough copies to fill wide screens.
  const marquee = strip.length ? [...strip, ...strip, ...strip].slice(0, Math.max(strip.length * 2, 8)) : [];

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <style>{MARQUEE_CSS}</style>

      {/* ── top bar ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <span className="flex gap-1" aria-hidden>
            <span className="size-4 bg-red" />
            <span className="size-4 rotate-45 bg-blue" />
            <span className="size-4 rounded-full bg-yellow" />
          </span>
          <span className="text-caption font-bold uppercase tracking-widest">À un flâneur</span>
        </div>
        <Link href="/login" className={`${NAV_LINK} hover:bg-ink hover:text-paper`}>
          {signIn}
        </Link>
      </header>

      {/* ── hero ────────────────────────────────────────────── */}
      <section id="main" className="grid grow items-center gap-8 px-6 py-10 md:grid-cols-[1.2fr_1fr] md:px-10 md:py-16">
        <div className="flex flex-col gap-6">
          <motion.h1
            className="text-display font-bold uppercase leading-[0.95]"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
          >
            {L.heroTaglinePre}{" "}
            <span className="text-blue">technē</span>{" "}
            {L.heroTaglinePost}
          </motion.h1>
          <motion.p
            className="max-w-xl text-body"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.7 }}
          >
            {L.heroLead}
          </motion.p>
          <motion.div
            className="flex flex-wrap gap-3"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Link
              href="/login"
              className="border-2 border-ink bg-ink px-6 py-3 text-caption font-bold uppercase text-paper transition-colors hover:bg-blue hover:border-blue"
            >
              {L.enterAtelier}
            </Link>
            <a href="#work" className={`${NAV_LINK} hover:bg-yellow`}>
              {L.seeWork}
            </a>
          </motion.div>
        </div>
        <div className="mx-auto aspect-square w-full max-w-sm">
          <HeroMark />
        </div>
      </section>

      {/* ── what it is ──────────────────────────────────────── */}
      <section className="border-t-2 border-ink px-6 py-14 md:px-10">
        <Reveal>
          <h2 className="mb-8 text-h1 font-bold uppercase">{L.threeWaysIn}</h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { t: L.postT, bar: "bg-red/15", dot: "bg-red", d: L.postD },
            { t: L.groupsT, bar: "bg-blue/15", dot: "bg-blue", d: L.groupsD },
            { t: L.discoverT, bar: "bg-yellow/15", dot: "bg-yellow", d: L.discoverD },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 0.08}>
              <div className="h-full border-2 border-ink bg-paper">
                <div className={`flex items-center gap-2 border-b-2 border-ink px-4 py-2 ${c.bar}`}>
                  <span className={`size-3 ${c.dot}`} />
                  <span className="text-caption font-bold uppercase">{c.t}</span>
                </div>
                <p className="p-4 text-body">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── living work strip ───────────────────────────────── */}
      <section id="work" className="overflow-hidden border-t-2 border-ink bg-ink py-14 text-paper">
        <Reveal className="px-6 md:px-10">
          <h2 className="mb-2 text-h1 font-bold uppercase">{L.madeHere}</h2>
          <p className="mb-8 max-w-md text-body opacity-80">{L.madeHereSub}</p>
        </Reveal>
        {marquee.length ? (
          <div className="af-marquee-mask">
            <div className={`af-marquee ${reduce ? "af-marquee--static" : ""}`}>
              {marquee.map((p, i) => (
                // Not a link — the strip is a showcase, not navigation.
                <div
                  key={`${p.id}-${i}`}
                  className="af-tile group relative block shrink-0 border-2 border-paper"
                  title={`Work by ${p.author}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.alt} loading="lazy" decoding="async"
                    className="size-40 object-cover md:size-52" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-ink/70 px-2 py-1 text-caption font-bold uppercase opacity-0 transition-opacity group-hover:opacity-100">
                    {p.author}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center gap-4 px-6">
            <span className="size-24 bg-red" />
            <span className="size-24 rotate-45 bg-blue" />
            <span className="size-24 rounded-full bg-yellow" />
          </div>
        )}
      </section>

      {/* ── the three roles ─────────────────────────────────── */}
      <section className="border-t-2 border-ink px-6 py-14 md:px-10">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <Reveal>
            <h2 className="text-h1 font-bold uppercase">{L.rolesTitle1}<br /><span className="text-red">{L.rolesTitle2}</span></h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex flex-col gap-4">
              <p className="text-body">{L.rolesLead}</p>
              <Link
                href="/login"
                className="self-start border-2 border-ink bg-ink px-6 py-3 text-caption font-bold uppercase text-paper transition-colors hover:bg-red hover:border-red"
              >
                {L.joinCreator}
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div data-role="visitor" className="border-2 border-ink p-5">
              <p className="text-caption font-bold uppercase tracking-widest text-blue">{L.visitor}</p>
              <p className="mt-2 text-body">{L.visitorD}</p>
            </div>
            <div data-role="creator" className="border-2 border-ink p-5">
              <p className="text-caption font-bold uppercase tracking-widest text-red">{L.creatorRole}</p>
              <p className="mt-2 text-body">{L.creatorD}</p>
            </div>
            <div data-role="curator" className="border-2 border-ink p-5">
              <p className="text-caption font-bold uppercase tracking-widest">{L.curatorRole}</p>
              <p className="mt-2 text-body">{L.curatorD}</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── explore the app ─────────────────────────────────── */}
      <section className="border-t-2 border-ink px-6 py-14 md:px-10">
        <Reveal>
          <h2 className="text-h1 font-bold uppercase">{L.moreThanFeed}</h2>
          <p className="mt-2 max-w-xl text-body">{L.moreThanFeedSub}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { k: L.exEventsK, a: "text-red", d: L.exEventsD },
              { k: L.exJobsK, a: "text-blue", d: L.exJobsD },
              { k: L.exListenK, a: "text-ink", d: L.exListenD },
              { k: L.exGroupsK, a: "text-blue", d: L.exGroupsD },
              { k: L.exChatK, a: "text-red", d: L.exChatD },
              { k: L.exCuratedK, a: "text-ink", d: L.exCuratedD },
            ].map((f) => (
              <div key={f.k} data-explore={f.k} className="border-2 border-ink p-5">
                <p className={`text-caption font-bold uppercase tracking-widest ${f.a}`}>{f.k}</p>
                <p className="mt-2 text-body">{f.d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── astelier teaser ─────────────────────────────────── */}
      <section className="border-t-2 border-ink bg-yellow px-6 py-14 md:px-10">
        <Reveal>
          <div className="flex flex-col items-start gap-4">
            <span className="text-caption font-bold uppercase tracking-widest">Astelier</span>
            <h2 className="max-w-2xl text-h1 font-bold uppercase">{L.astelierTitle}</h2>
            <p className="max-w-xl text-body">{L.astelierSub}</p>
          </div>
        </Reveal>
      </section>

      {/* ── footer ──────────────────────────────────────────── */}
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink px-6 py-8 md:px-10">
        <span className="flex gap-1" aria-hidden>
          <span className="size-4 bg-red" />
          <span className="size-4 rotate-45 bg-blue" />
          <span className="size-4 rounded-full bg-yellow" />
        </span>
        <nav className="flex flex-wrap gap-4 text-caption font-bold uppercase">
          <Link href="/login" className="hover:text-blue">{signIn}</Link>
          <Link href="/terms" className="hover:text-blue">{footer.terms}</Link>
          <Link href="/privacy" className="hover:text-blue">{footer.privacy}</Link>
          <Link href="/copyright" className="hover:text-blue">{footer.copyright}</Link>
          <a href="mailto:atelier@aunflaneur.com" className="hover:text-blue">{footer.contact}</a>
        </nav>
        <span className="text-caption uppercase opacity-60">À un flâneur</span>
        {!configured ? (
          <span data-setup-notice className="w-full text-caption uppercase opacity-50">
            {L.previewNotice}
          </span>
        ) : null}
      </footer>
    </div>
  );
}

const MARQUEE_CSS = `
.af-marquee-mask { -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); }
.af-marquee { display: flex; gap: 12px; width: max-content; padding: 0 12px; animation: af-scroll 42s linear infinite; }
.af-marquee:hover { animation-play-state: paused; }
.af-marquee--static { animation: none; overflow-x: auto; max-width: 100%; padding-bottom: 8px; }
.af-tile { overflow: hidden; }
@keyframes af-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.af-float { animation: af-bob 7s ease-in-out infinite; }
@keyframes af-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@media (prefers-reduced-motion: reduce) {
  .af-marquee { animation: none; overflow-x: auto; max-width: 100%; }
  .af-float { animation: none; }
}
`;
