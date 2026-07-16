"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";

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

/** The hero composition — three marks assemble into place on load. Ambient
 *  float lives on the wrapping element via CSS, so it can't fight the variants. */
function HeroMark() {
  const reduce = useReducedMotion();
  const shape: Variants = {
    hidden: (i: number) => ({
      opacity: 0,
      scale: 0.6,
      x: [-40, 30, 0][i] ?? 0,
      y: [30, -20, 24][i] ?? 0,
      rotate: [-18, 12, -8][i] ?? 0,
    }),
    show: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      rotate: 0,
      transition: { type: "spring", stiffness: 90, damping: 14 },
    },
  };

  return (
    <motion.svg
      viewBox="0 0 220 220"
      className="h-full w-full"
      role="img"
      aria-label="À un flâneur composition mark"
      initial={reduce ? "show" : "hidden"}
      animate="show"
      transition={{ staggerChildren: 0.14 }}
    >
      {/* ink scaffolding */}
      <motion.line
        x1="16" y1="200" x2="200" y2="28"
        stroke="var(--color-ink)" strokeWidth="3"
        variants={{ hidden: { pathLength: 0, opacity: 0 }, show: { pathLength: 1, opacity: 1, transition: { duration: 0.7 } } }}
      />
      <motion.rect custom={0} variants={shape}
        x="30" y="30" width="72" height="72" fill="var(--color-red)" />
      <motion.polygon custom={2} variants={shape}
        points="150,120 190,196 110,196" fill="var(--color-yellow)" />
      <motion.circle custom={1} variants={shape}
        cx="156" cy="66" r="34" fill="var(--color-blue)" />
    </motion.svg>
  );
}

const NAV_LINK =
  "border-2 border-ink px-5 py-2 text-caption font-bold uppercase transition-colors";

export function Landing({ strip, configured }: { strip: StripItem[]; configured: boolean }) {
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
          Sign in
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
            A space for<br />people who<br /><span className="text-blue">make things</span>.
          </motion.h1>
          <motion.p
            className="max-w-md text-body"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.7 }}
          >
            Art, photography, handmade, music, words. Community-first — your work
            reaches everyone who follows you, in order, every time. No ads, no
            pay-to-be-seen.
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
              Enter the atelier →
            </Link>
            <a href="#work" className={`${NAV_LINK} hover:bg-yellow`}>
              See the work
            </a>
          </motion.div>
        </div>
        <div className="af-float mx-auto aspect-square w-full max-w-sm">
          <HeroMark />
        </div>
      </section>

      {/* ── what it is ──────────────────────────────────────── */}
      <section className="border-t-2 border-ink px-6 py-14 md:px-10">
        <Reveal>
          <h2 className="mb-8 text-h1 font-bold uppercase">Three ways in</h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { t: "Post", bar: "bg-red/15", dot: "bg-red", d: "Publish work — images, audio, video, or words. Carousels up to ten. It reaches your followers in order, untouched by any algorithm." },
            { t: "Groups", bar: "bg-blue/15", dot: "bg-blue", d: "Gather around a discipline. Run discussions, share works-in-progress, make announcements. Public or members-only — your call." },
            { t: "Discover", bar: "bg-yellow/15", dot: "bg-yellow", d: "Wander. Follow people whose work you love, stumble on studios and galleries, and find your corners of the craft." },
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
          <h2 className="mb-2 text-h1 font-bold uppercase">Made here, lately</h2>
          <p className="mb-8 max-w-md text-body opacity-80">
            Real work, freshly posted. This is the whole point.
          </p>
        </Reveal>
        {marquee.length ? (
          <div className="af-marquee-mask">
            <div className={`af-marquee ${reduce ? "af-marquee--static" : ""}`}>
              {marquee.map((p, i) => (
                <Link
                  key={`${p.id}-${i}`}
                  href={`/p/${p.id}`}
                  className="af-tile group relative block shrink-0 border-2 border-paper"
                  title={`Work by ${p.author}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.alt} loading="lazy" decoding="async"
                    className="size-40 object-cover md:size-52" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-ink/70 px-2 py-1 text-caption font-bold uppercase opacity-0 transition-opacity group-hover:opacity-100">
                    {p.author}
                  </span>
                </Link>
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

      {/* ── for creators ────────────────────────────────────── */}
      <section className="border-t-2 border-ink px-6 py-14 md:px-10">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <Reveal>
            <h2 className="text-h1 font-bold uppercase">Anyone can wander in.<br /><span className="text-red">Creators shape it.</span></h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex flex-col gap-4">
              <p className="text-body">
                Browsing, following, and joining groups is open to everyone. Posting
                work and starting groups is for creators — a quick, human review keeps
                the space real. Tell us what you make and share a couple of links.
              </p>
              <Link
                href="/login"
                className="self-start border-2 border-ink bg-ink px-6 py-3 text-caption font-bold uppercase text-paper transition-colors hover:bg-red hover:border-red"
              >
                Join as a creator →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── astelier teaser ─────────────────────────────────── */}
      <section className="border-t-2 border-ink bg-yellow px-6 py-14 md:px-10">
        <Reveal>
          <div className="flex flex-col items-start gap-4">
            <span className="text-caption font-bold uppercase tracking-widest">Astelier</span>
            <h2 className="max-w-2xl text-h1 font-bold uppercase">Sell the work too — no middleman between you and the people who want it.</h2>
            <p className="max-w-xl text-body">
              A commerce sibling for the makers who want it. Coming alongside the launch.
            </p>
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
          <Link href="/login" className="hover:text-blue">Sign in</Link>
          <Link href="/terms" className="hover:text-blue">Terms</Link>
          <Link href="/privacy" className="hover:text-blue">Privacy</Link>
        </nav>
        <span className="text-caption uppercase opacity-60">À un flâneur</span>
        {!configured ? (
          <span data-setup-notice className="w-full text-caption uppercase opacity-50">
            Preview mode — sign-in needs Supabase configured
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
