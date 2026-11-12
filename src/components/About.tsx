"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { portfolioData } from "@/data/portfolio";
import { Code2, MapPin, Quote, Rocket } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { SWARM_APPEND_EVENT, SWARM_DEFER_ATTR, SWARM_PENDING_ATTR, SWARM_RUNNING_ATTR } from "./swarm/constants";

/*
 * Profile ribbon (desktop, motion allowed). Scroll drives one smoothed progress value
 * `p` (0..1): two headline lines run across a pinned stage in opposite directions while
 * the cards ride a fixed 3D rail - small along the bottom, a shallow close pass through
 * the middle, around the left edge, away along the top - and each card drops into a
 * 3-column grid as it leaves the rail. The runway stays, so the ribbon plays every time the
 * visitor scrolls down through it (and rewinds on the way back up). Smaller screens and
 * reduced motion get a plain grid.
 */

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);
const out = (t: number) => 1 - (1 - t) ** 3;
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

// Rail in world units: camera at the origin looking down -z.
const PH0 = -1.5;
const PH1 = Math.PI * 2 + 1.35;
const SAMPLES = 1200;
const CARD_W = 2.1; // card width in world units
const STEP = CARD_W + 0.24; // flat panels need air between them on the curves
const RIB_A = 0.11; // ribbon starts moving
const RIB_B = 0.76; // ribbon has run the whole rail
const FLY = 0.13; // scroll spent flying from the rail into the grid
const GRID_GAP = 20; // px, same as the page's card gaps
const MAIN = 3; // the profile cards: each rides the ribbon once, then lands in the grid
const HOLD = 0.6; // viewport heights at the end of the runway where the finished grid stays pinned

type Rail = { L: number; pts: Float32Array; tans: Float32Array };

function buildRail(): Rail {
  const RAW = 3000;
  const raw: number[][] = [];
  for (let i = 0; i <= RAW; i++) {
    const t = i / RAW;
    const ph = mix(PH0, PH1, t);
    const cs = Math.cos(ph);
    const u = 2 * t - 1;
    // shallow arc close to the camera, long runs far behind it
    const depth = cs > 0 ? 7.6 + 11.4 * cs ** 0.9 : 7.6 + 2.2 * cs;
    const edge = 0.84 + 0.5 * span(0.14 - t, 0, 0.14) + 0.8 * span(t, 0.84, 1);
    raw.push([edge * Math.sin(ph) * depth * 0.561, 0.5 * Math.sign(u) * Math.abs(u) ** 1.4 * depth * 0.63, -depth]);
  }
  const cum = [0];
  for (let i = 1; i <= RAW; i++) {
    const [a, b] = [raw[i - 1], raw[i]];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  const L = cum[RAW];
  // Resample by arc length so cards keep an even spacing along the rail.
  const pts = new Float32Array((SAMPLES + 1) * 3);
  for (let i = 0, j = 0; i <= SAMPLES; i++) {
    const s = (L * i) / SAMPLES;
    while (j < RAW - 1 && cum[j + 1] < s) j++;
    const k = clamp((s - cum[j]) / (cum[j + 1] - cum[j] || 1));
    for (let c = 0; c < 3; c++) pts[i * 3 + c] = mix(raw[j][c], raw[j + 1][c], k);
  }
  const tans = new Float32Array((SAMPLES + 1) * 3);
  for (let i = 0; i <= SAMPLES; i++) {
    const a = Math.max(0, i - 2) * 3;
    const b = Math.min(SAMPLES, i + 2) * 3;
    const d = [pts[b] - pts[a], pts[b + 1] - pts[a + 1], pts[b + 2] - pts[a + 2]];
    const n = Math.hypot(d[0], d[1], d[2]) || 1;
    for (let c = 0; c < 3; c++) tans[i * 3 + c] = d[c] / n;
  }
  return { L, pts, tans };
}

function railAt(r: Rail, s: number, p: number[], t: number[]) {
  const f = clamp(s / r.L) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(f));
  const k = f - i;
  for (let c = 0; c < 3; c++) {
    p[c] = mix(r.pts[i * 3 + c], r.pts[(i + 1) * 3 + c], k);
    t[c] = mix(r.tans[i * 3 + c], r.tans[(i + 1) * 3 + c], k);
  }
}

// Cards are absolute in the stage while the ribbon runs; a plain grid item otherwise.
const ON_RIBBON =
  "motion-safe:lg:absolute motion-safe:lg:left-1/2 motion-safe:lg:top-1/2 motion-safe:lg:h-[var(--rh)] motion-safe:lg:w-[var(--rw)] motion-safe:lg:invisible motion-safe:lg:will-change-transform motion-safe:lg:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.4)]";

export default function About() {
  const { personal } = portfolioData;
  const words = personal.shortBio.split(" ");

  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const l1Ref = useRef<HTMLDivElement>(null);
  const l2Ref = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const crossRef = useRef<HTMLDivElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;
    const mq = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    const rail = buildRail();
    const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
    const n = cards.length;
    const P3 = [0, 0, 0];
    const T3 = [0, 0, 0];

    let on = false;
    let raf = 0;
    let p = 0;
    let target = 0;
    let prev = 0;
    let visible = false;
    let handed = false; // this rebuild already took over the cards' contents
    let W = 1, H = 1, P = 1, k = 1, cardW = 400, cardH = 360, contentW = 1280;
    const GRID_Y = 30; // grid sits a little below centre, clear of the fixed navbar

    const layout = () => {
      W = stage.clientWidth;
      H = stage.clientHeight;
      const asp = W / H;
      // Keep the horizontal view fixed below 16:9 so the ribbon never squashes.
      const tanH = asp < 16 / 9 ? 0.561 / asp : Math.tan((17.5 * Math.PI) / 180);
      P = H / (2 * tanH);
      stage.style.perspective = `${P}px`;
      contentW = Math.min(1280, W - 64);
      cardW = (contentW - 2 * GRID_GAP) / 3;
      stage.style.setProperty("--rw", `${cardW}px`);
      // Every card takes the height of the tallest profile card at this width.
      let h = 0;
      for (let i = 0; i < MAIN; i++) {
        cards[i].style.height = "auto";
        h = Math.max(h, cards[i].offsetHeight);
        cards[i].style.height = "";
      }
      cardH = Math.ceil(h);
      stage.style.setProperty("--rh", `${cardH}px`);
      k = cardW / CARD_W;
      if (ruleRef.current) {
        ruleRef.current.style.top = `${H / 2 + GRID_Y + cardH / 2 + 36}px`;
        ruleRef.current.style.left = ruleRef.current.style.right = `${(W - contentW) / 2}px`;
      }
    };

    const render = () => {
      // Headline: two lines rise into place, then pass each other like trains.
      const rise = 1 - out(span(p, 0, 0.11));
      const run = mix(-50, 110, span(p, 0, 0.62)); // far enough that both lines fully leave the stage
      if (l1Ref.current) l1Ref.current.style.transform = `translate3d(${run}vw,${rise * 34}vh,0)`;
      if (l2Ref.current) l2Ref.current.style.transform = `translate3d(${-run}vw,${rise * 34}vh,0)`;
      if (capRef.current) {
        capRef.current.style.opacity = String(1 - span(p, 0.55, 0.6));
        capRef.current.style.transform = `translate(-50%,calc(-50% + ${rise * 34}vh))`;
      }
      if (crossRef.current) crossRef.current.style.opacity = String(1 - span(p, 0, 0.05));
      if (ruleRef.current) ruleRef.current.style.transform = `scaleX(${ease(span(p, 0.84, 0.95))})`;

      const total = rail.L + n * STEP;
      const head = mix(0, total, span(p, RIB_A, RIB_B));
      const end = rail.L - CARD_W;
      for (let i = 0; i < n; i++) {
        const el = cards[i];
        const s = head - i * STEP;
        if (s < end) {
          if (s <= CARD_W) { el.style.visibility = "hidden"; continue; }
          railAt(rail, s, P3, T3);
          const d = -P3[2];
          const x = P3[0] * k;
          const y = -P3[1] * k;
          const z = P - d * k;
          // Lie along the rail, and always show the front so text never reads mirrored.
          let a = Math.atan2(-T3[2], T3[0]);
          const vx = -x, vy = -y, vz = P - z;
          let facing = (Math.sin(a) * vx + Math.cos(a) * vz) / Math.hypot(vx, vy, vz);
          if (facing < 0) { a += Math.PI; facing = -facing; }
          // Fade out as the card turns edge-on: no slivers, and the flip happens unseen.
          const fade = span(facing, 0.12, 0.38);
          el.style.visibility = fade > 0.01 ? "visible" : "hidden";
          el.style.opacity = String(ease(fade));
          el.style.transform = `translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotateY(${a}rad)`;
        } else if (i < MAIN) {
          // Fly straight from the end of the rail into the grid slot.
          const st = mix(RIB_A, RIB_B, (end + i * STEP) / total);
          const q = out(span(p, st, st + FLY));
          if (q < 0.001) { el.style.visibility = "hidden"; continue; }
          const c = i - 1; // -1, 0, 1: left, middle, right column
          const x = c * (cardW + GRID_GAP) + c * 1.2 * 0.62 * W * (1 - q);
          const y = GRID_Y - H * (c === 0 ? 0.95 : 0.34) * (1 - q);
          const tilt = -(1 - q) * 0.22 * (c || 0.5);
          el.style.visibility = "visible";
          el.style.opacity = "1";
          el.style.transform = `translate(-50%,-50%) translate3d(${x}px,${y}px,0) rotateZ(${tilt}rad)`;
        } else {
          el.style.visibility = "hidden";
        }
      }
    };

    const readScroll = () => {
      const r = track.getBoundingClientRect();
      // The last HOLD of the runway keeps the finished grid pinned (p stays at 1).
      target = clamp(-r.top / Math.max(1, track.offsetHeight - window.innerHeight * (1 + HOLD)));
    };

    // Swarm rebuild: on its first pass the cards ride the ribbon as blank panels; once they
    // land in the grid the swarm builds their contents. With no rebuild running they show.
    const swarmBuilding = () => {
      const html = document.documentElement;
      return html.hasAttribute(SWARM_RUNNING_ATTR) || html.hasAttribute(SWARM_PENDING_ATTR);
    };
    const deferCards = () => {
      if (!swarmBuilding()) {
        handed = false; // the next rebuild (Replay) takes over again
        return;
      }
      if (handed) return;
      for (const el of cards.slice(0, MAIN)) if (!el.hasAttribute(SWARM_DEFER_ATTR)) el.setAttribute(SWARM_DEFER_ATTR, "");
    };
    // The moment the last profile card has flown into its grid slot (well before p = 1).
    const LAND = Math.min(
      1,
      mix(RIB_A, RIB_B, (rail.L - CARD_W + (MAIN - 1) * STEP) / (rail.L + n * STEP)) + FLY + 0.01,
    );
    const handToSwarm = () => {
      const deferred = cards.slice(0, MAIN).filter((el) => el.hasAttribute(SWARM_DEFER_ATTR));
      if (!deferred.length) return;
      if (document.documentElement.hasAttribute(SWARM_RUNNING_ATTR)) {
        handed = true;
        window.dispatchEvent(new CustomEvent(SWARM_APPEND_EVENT, { detail: deferred }));
      } else {
        for (const el of deferred) el.removeAttribute(SWARM_DEFER_ATTR);
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - prev) / 1000 || 0.016);
      prev = now;
      p += (target - p) * (1 - Math.pow(1 - 0.07, dt * 60)); // gentle follow: smooth, a little slow
      if (Math.abs(target - p) < 0.0005) p = target;
      render();
      if (p >= LAND) handToSwarm(); // cards have landed in the grid, stage still pinned
      raf = visible && p !== target ? requestAnimationFrame(frame) : 0;
    };
    const wake = () => {
      if (on && visible && !raf) { prev = performance.now(); raf = requestAnimationFrame(frame); }
    };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake(); }, { rootMargin: "200px 0px" });
    const ro = new ResizeObserver(() => onResize());
    const onScroll = () => {
      if (!on) return;
      // A rebuild started after load (Replay) also gets blank panels on the ribbon.
      deferCards();
      readScroll();
      wake();
    };
    const onResize = () => { if (on) { layout(); readScroll(); render(); } };

    const clear = () => {
      stage.style.perspective = "";
      track.style.height = "";
      for (const el of cards) { el.style.transform = ""; el.style.visibility = ""; el.style.opacity = ""; el.style.height = ""; }
      for (const el of [l1Ref.current, l2Ref.current, capRef.current, crossRef.current, ruleRef.current]) {
        if (el) { el.style.transform = ""; el.style.opacity = ""; }
      }
    };
    const apply = () => {
      on = mq.matches;
      // The swarm rebuild reveals the moving ribbon as one block instead of chasing its cards.
      if (on) track.dataset.swarmAs = "fade";
      else delete track.dataset.swarmAs;
      if (on) deferCards();
      else for (const el of cards.slice(0, MAIN)) el.removeAttribute(SWARM_DEFER_ATTR);
      if (on) {
        layout();
        readScroll();
        p = target; // start where the page already is, no sweep on load
        render();
        if (p >= LAND) handToSwarm(); // reloaded below the ribbon: the grid is already in place
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
        clear();
      }
    };

    io.observe(track);
    ro.observe(stage);
    window.addEventListener("scroll", onScroll, { passive: true });
    mq.addEventListener("change", apply);
    apply();
    document.fonts?.ready.then(onResize);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", apply);
    };
  }, []);

  const setCard = (i: number) => (el: HTMLElement | null) => { cardRefs.current[i] = el; };

  return (
    <section id="about" className="relative overflow-clip border-t border-black/10 bg-[#eaeae7] px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-white/80 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeader label="Profile" title="Not just code." accent="Practical solutions." />

        {/* Lead: words light up one after another */}
        <p className="mb-14 max-w-5xl text-left text-xl font-medium leading-snug tracking-[-0.01em] text-neutral-950 sm:text-3xl motion-safe:lg:mb-0">
          {words.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0.15 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
              transition={{ duration: 0.4, delay: i * 0.025 }}
            >
              {w}{" "}
            </motion.span>
          ))}
        </p>
      </div>

      {/* Ribbon track: scroll runway with a pinned full-width stage (removed after one run) */}
      <div ref={trackRef} className="relative -mx-4 sm:-mx-6 lg:-mx-8 motion-safe:lg:h-[300vh]">
        <div
          ref={stageRef}
          className="relative px-4 sm:px-6 lg:px-8 motion-safe:lg:sticky motion-safe:lg:top-0 motion-safe:lg:h-screen motion-safe:lg:overflow-hidden motion-safe:lg:px-0"
          style={{ "--rw": "400px", "--rh": "360px" } as React.CSSProperties}
        >
          {/* Stage furniture, ribbon mode only */}
          <div aria-hidden="true" className="pointer-events-none hidden motion-safe:lg:block">
            <div ref={crossRef} className="absolute inset-x-8 top-[37.5%] h-px bg-black/[0.08]">
              <i className="absolute left-1/2 -top-[0.62em] -ml-[0.55em] bg-[#eaeae7] px-[0.3em] font-mono text-[13px] not-italic leading-[1.2] text-black/35">+</i>
            </div>
            <div ref={l1Ref} className="absolute inset-x-0 top-[calc(50%-0.98em)] whitespace-nowrap text-center text-[clamp(40px,6.7vw,130px)] font-black uppercase leading-none tracking-[-0.055em] text-neutral-950 will-change-transform">
              <span className="mr-[15vw] inline-block">Code quality</span>
            </div>
            <div ref={l2Ref} className="absolute inset-x-0 top-[calc(50%+0.03em)] whitespace-nowrap text-center text-[clamp(40px,6.7vw,130px)] font-black uppercase leading-none tracking-[-0.055em] text-cobalt will-change-transform">
              <span className="ml-[15vw] inline-block">User impact.</span>
            </div>
            <div ref={capRef} className="absolute left-1/2 top-[calc(50%+clamp(40px,6.7vw,130px)*1.55)] w-[16em] -translate-x-1/2 -translate-y-1/2 text-center font-mono text-[clamp(9px,0.74vw,12px)] font-bold uppercase leading-[1.4] tracking-[0.2em] text-neutral-700">
              {personal.title}.
            </div>
            <div ref={ruleRef} className="absolute h-px origin-left scale-x-0 bg-black/10" />
          </div>

          <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-5 lg:grid-cols-3 motion-safe:lg:absolute motion-safe:lg:inset-0 motion-safe:lg:block motion-safe:lg:max-w-none motion-safe:lg:[transform-style:preserve-3d]">
            {/* Profile cards: ride the ribbon, then land in the grid */}
            <article ref={setCard(0)} className={`flex flex-col overflow-hidden rounded-3xl border border-black/10 bg-white p-6 sm:p-8 ${ON_RIBBON}`}>
              <div className="mb-5 flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-cobalt">
                <Code2 className="h-5 w-5" /> The developer journey
              </div>
              <p className="mb-6 text-base leading-relaxed text-neutral-700 sm:text-lg">{personal.aboutNarrative[0]}</p>
              <div className="mt-auto flex items-center gap-2 border-t border-black/10 pt-5 font-mono text-sm text-neutral-600">
                <MapPin className="h-4 w-4 text-cobalt" /> {personal.location}
              </div>
            </article>

            <article ref={setCard(1)} className={`flex flex-col overflow-hidden rounded-3xl border border-black/10 bg-white p-6 sm:p-8 ${ON_RIBBON}`}>
              <div className="mb-5 flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-cobalt">
                <Rocket className="h-5 w-5" /> Production work &amp; impact
              </div>
              <p className="text-base leading-relaxed text-neutral-700 sm:text-lg">{personal.aboutNarrative[1]}</p>
            </article>

            <article ref={setCard(2)} className={`relative flex flex-col overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-cobalt to-cobalt-deep p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-8 ${ON_RIBBON}`}>
              <Quote aria-hidden="true" className="absolute -right-2 -top-2 h-14 w-14 text-white/15" />
              <span className="mb-4 block font-mono text-[11px] uppercase tracking-widest text-white/70">{"// Professional goal"}</span>
              <p className="relative text-sm font-semibold leading-relaxed text-white sm:text-base">&ldquo;{personal.aboutNarrative[2]}&rdquo;</p>
              <div className="mt-auto flex items-center justify-between border-t border-white/20 pt-5">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-white">{personal.name}</div>
                  <div className="font-mono text-[11px] text-white/70">{personal.title}</div>
                </div>
                <span className="rounded bg-white/20 px-2 py-0.5 font-mono text-xs text-white">India</span>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
