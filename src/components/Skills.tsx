"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { portfolioData } from "@/data/portfolio";
import SectionHeader from "./SectionHeader";
import { SWARM_RUNNING_ATTR } from "./swarm/constants";

/*
 * A ribbon of skill cards that drifts sideways. The middle of the ribbon is flat;
 * past that it wraps onto the inside of a cylinder, so the cards at both edges
 * curl toward the viewer. Positions are written straight to the DOM every frame.
 */

const CARDS = [
  { card: "bg-cobalt text-white", sub: "text-white/70", chip: "border-white/20 bg-white/10" },
  { card: "bg-neutral-950 text-white", sub: "text-white/60", chip: "border-white/15 bg-white/[0.06]" },
  { card: "bg-white text-neutral-950 border border-black/[0.08]", sub: "text-neutral-500", chip: "border-black/10 bg-[#f3f3f1]" },
  { card: "bg-gradient-to-br from-cobalt-deep to-black text-white", sub: "text-white/60", chip: "border-white/15 bg-white/[0.06]" },
];

const SPEED = 34; // px per second while drifting
const IDLE_RESUME = 2500; // ms after an interaction before drifting again

function useStripSize() {
  const [size, setSize] = useState({ W: 370, H: 320, gap: 16 });
  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth;
      if (w < 640) setSize({ W: 260, H: 330, gap: 12 });
      else if (w < 1024) setSize({ W: 330, H: 320, gap: 14 });
      else setSize({ W: 370, H: 320, gap: 16 });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return size;
}

export default function Skills() {
  const { skills } = portfolioData;
  const n = skills.length;
  const { W, H, gap } = useStripSize();
  const step = W + gap;

  const stripRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const offset = useRef(0); // rendered scroll position, px
  const target = useRef(0); // where `offset` eases toward
  const drag = useRef<{ x: number; start: number } | null>(null);
  const hover = useRef(false);
  const lastTouch = useRef(0);
  const [active, setActive] = useState(0);

  const nudge = useCallback(
    (dir: number) => {
      lastTouch.current = performance.now();
      target.current = (Math.round(target.current / step) + dir) * step;
    },
    [step],
  );

  // Trackpad sideways swipes and Shift + mouse wheel scroll the strip; plain vertical wheel still scrolls the page.
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      lastTouch.current = performance.now();
      target.current += dx;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let prev = performance.now();
    let shown = -1;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const idle = now - lastTouch.current > IDLE_RESUME;
      const building = document.documentElement.hasAttribute(SWARM_RUNNING_ATTR); // hold still while the swarm builds the cards
      if (!reduce && idle && !building && !hover.current && !drag.current) target.current += SPEED * dt;
      offset.current += (target.current - offset.current) * (drag.current ? 1 : 1 - Math.pow(0.0015, dt));

      const vw = stripRef.current?.clientWidth ?? window.innerWidth;
      const flat = Math.max(W * 0.6, vw * 0.25); // half-width of the flat middle
      const R = Math.max(170, vw * 0.15); // cylinder radius at the edges
      const total = n * step;

      for (let i = 0; i < n; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        // Card centre on the unrolled ribbon, wrapped so the loop is seamless.
        let s = i * step - offset.current;
        s = ((((s + total / 2) % total) + total) % total) - total / 2;
        const a = Math.abs(s);
        const sign = Math.sign(s) || 1;
        let x = s;
        let z = 0;
        let ry = 0;
        if (a > flat) {
          const phi = Math.min((a - flat) / R, Math.PI * 0.62);
          x = sign * (flat + R * Math.sin(phi));
          z = R * (1 - Math.cos(phi));
          ry = -sign * phi;
        }
        const fade = a > flat ? Math.max(0, 1 - Math.max(0, (a - flat) / R - 1.2) / 0.7) : 1;
        el.style.transform = `translate3d(${x - W / 2}px,0,${z}px) rotateY(${ry}rad)`;
        el.style.opacity = String(fade);
        el.style.zIndex = String(1000 - Math.round(a));
      }

      const idx = ((Math.round(offset.current / step) % n) + n) % n;
      if (idx !== shown) {
        shown = idx;
        setActive(idx);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [W, n, step]);

  return (
    <section id="skills" className="relative overflow-hidden border-t border-black/10 bg-[#f3f3f1] px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(ellipse_60%_60%_at_50%_100%,rgba(255,255,255,0.57),transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeader label="Technical Skills" title="Skills &" accent="arsenal." />
      </div>

      {/* Ribbon (full-bleed) */}
      <div
        ref={stripRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Skill categories"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); nudge(1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); nudge(-1); }
        }}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") hover.current = true; }}
        onPointerLeave={() => { hover.current = false; }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, start: target.current };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          target.current = drag.current.start - (e.clientX - drag.current.x);
        }}
        onPointerUp={() => {
          if (!drag.current) return;
          drag.current = null;
          lastTouch.current = performance.now();
          target.current = Math.round(target.current / step) * step;
        }}
        onPointerCancel={() => { drag.current = null; }}
        className="relative left-1/2 mt-4 w-screen -translate-x-1/2 cursor-grab touch-pan-y select-none outline-none [perspective:1100px] active:cursor-grabbing focus-visible:ring-1 focus-visible:ring-cobalt/50"
        style={{ height: H + 120 }}
      >
        <ul className="absolute left-1/2 top-[60px] [transform-style:preserve-3d]" style={{ height: H }}>
          {skills.map((cat, i) => {
            const v = CARDS[i % CARDS.length];
            return (
              <li
                key={cat.category}
                ref={(el) => { cardRefs.current[i] = el; }}
                aria-label={`${cat.category}, ${cat.skills.length} skills`}
                className={`absolute left-0 top-0 flex flex-col overflow-hidden rounded-2xl p-5 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.45)] [backface-visibility:hidden] will-change-transform sm:p-6 ${v.card}`}
                style={{ width: W, height: H }}
              >
                <span aria-hidden="true" className="pointer-events-none absolute -bottom-8 -right-3 select-none text-[120px] font-black leading-none tracking-[-0.08em] opacity-[0.07]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={`flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] ${v.sub}`}>
                  <span>{String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
                  <span>{cat.skills.length} skills</span>
                </span>
                <span className="mt-3 shrink-0 text-xl font-black uppercase leading-[0.95] tracking-[-0.03em] sm:text-2xl">{cat.category}</span>
                {cat.description && <span className={`mt-2 line-clamp-2 shrink-0 text-[11px] leading-relaxed sm:text-xs ${v.sub}`}>{cat.description}</span>}
                <span className="relative mt-auto flex flex-wrap gap-2 pt-4">
                  {cat.skills.map((s) => (
                    <span key={s} className={`rounded-lg border px-2.5 py-1 text-[13px] font-semibold leading-tight tracking-[-0.01em] sm:px-3 ${v.chip}`}>
                      {s}
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
        </ul>
        {/* Floor shadow */}
        <div aria-hidden="true" className="absolute left-1/2 h-10 w-[min(900px,80%)] -translate-x-1/2 rounded-[50%] bg-black/10 blur-2xl" style={{ top: H + 70 }} />
      </div>

      {/* Caption */}
      <div className="relative mx-auto mt-2 max-w-7xl text-center" aria-live="polite">
        <div className="truncate text-lg font-bold text-neutral-950 sm:text-2xl">{skills[active].category}</div>
      </div>
    </section>
  );
}
