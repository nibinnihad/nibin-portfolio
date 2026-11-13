"use client";

import React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin } from "lucide-react";

const PHOTO = "/nibin-hero.webp";
const EASE = [0.22, 1, 0.36, 1] as const;
// Guide lines of the editorial grid (percent of the stage), "+" marks sit where they cross.
const COLS = [0, 36, 64, 100];
const ROWS = [4, 30, 68];

type Props = {
  status: string;
  location: string;
  title: string;
};

/**
 * Editorial hero, straight on the page background (no card): a guide grid, "Portfolio" as a giant
 * watermark, the cut-out portrait standing on the right, and the full name set big at the bottom left.
 */
export default function HeroStage({ status, location, title }: Props) {
  const reduce = useReducedMotion();
  // Same initial/animate on server and client (keeps hydration in sync); reduced motion only makes it instant.
  const enter = (from: Record<string, number>, to: Record<string, number>, duration: number, delay = 0) => ({
    initial: from,
    animate: to,
    transition: reduce ? { duration: 0 } : { duration, ease: EASE, delay },
  });
  const rise = (delay: number, y = 24) => enter({ opacity: 0, y }, { opacity: 1, y: 0 }, 0.9, delay);

  return (
    <div className="relative isolate text-neutral-950 lg:col-span-12">
      {/* Soft light behind the head */}
      <div aria-hidden="true" className="absolute left-1/2 top-[8%] -z-10 -ml-[260px] sm:left-[74%] h-[520px] w-[520px] rounded-full bg-cobalt/[0.10] blur-[110px]" />

      {/* Guide grid with + marks */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {COLS.map((x) => (
          <span key={`c${x}`} className="absolute inset-y-0 w-px bg-black/[0.07]" style={{ left: `${x}%` }} />
        ))}
        {ROWS.map((y) => (
          <span key={`r${y}`} className="absolute inset-x-0 h-px bg-black/[0.07]" style={{ top: `${y}%` }} />
        ))}
        {COLS.flatMap((x) =>
          ROWS.map((y) => (
            <span
              key={`p${x}-${y}`}
              className="absolute -ml-[6px] -mt-[7px] font-mono text-[13px] leading-none text-black/35"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              +
            </span>
          )),
        )}
      </div>

      {/* Giant watermark word behind the head */}
      <motion.div
        aria-hidden="true"
        {...enter({ opacity: 0, y: -30 }, { opacity: 1, y: 0 }, 1.1)}
        className="pointer-events-none absolute inset-x-0 top-[2%] -z-10 select-none whitespace-nowrap text-center text-[clamp(56px,16vw,240px)] font-black uppercase leading-[0.8] tracking-[-0.06em] text-black/[0.05]"
      >
        Por
        <span className="relative inline-block">
          T
          {/* Small "Siuuu" mark standing on top of the T */}
          <Image
            src="/suii-logo.png"
            alt=""
            width={127}
            height={160}
            className="absolute bottom-[calc(100%-0.04em)] left-1/2 h-[max(20px,0.2em)] w-auto -translate-x-1/2 opacity-90"
          />
        </span>
        folio
      </motion.div>

      <div className="relative min-h-[640px] sm:min-h-[680px] lg:h-[660px] lg:min-h-0">
        {/* Portrait standing on the stage */}
        <div data-swarm-as="walk" className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[64%] justify-center sm:h-[86%] sm:justify-end lg:h-[95%]">
          <div className="h-full translate-x-[22%] sm:translate-x-[6%]">
          <motion.div
            {...enter({ opacity: 0, y: 60, scale: 0.97 }, { opacity: 1, y: 0, scale: 1 }, 1.2, 0.15)}
            className="relative h-full"
          >
            <Image
              src={PHOTO}
              alt="Portrait of Nibin Nihad wearing sunglasses and a checked shirt"
              width={1101}
              height={1313}
              priority
              unoptimized
              className="h-full w-auto object-contain object-bottom drop-shadow-[0_30px_40px_rgba(0,0,0,0.18)] [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]"
            />
            {/* Tiny brand mark printed on the shirt's chest (positioned in % of the photo) */}
            <span
              aria-hidden="true"
              className="absolute left-[69%] top-[78.5%] flex -translate-x-1/2 rotate-[5deg] select-none flex-col items-center gap-[0.3em] text-[#4f4642] opacity-90 mix-blend-multiply text-[5px] sm:text-[6px] lg:text-[7px]"
            >
              <span className="font-extrabold uppercase leading-none tracking-[0.22em] [text-shadow:0_0.5px_0_rgba(79,70,66,0.35)]">VAVEES</span>
            </span>
          </motion.div>
          </div>
        </div>
        {/* Ground fade so the name stays readable over the shirt */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-[#f3f3f1] via-[#f3f3f1]/70 to-transparent sm:h-[16%] sm:via-[#f3f3f1]/30 [mask-image:linear-gradient(to_right,transparent,black_30%)] sm:[mask-image:linear-gradient(to_right,transparent_45%,black_70%)]" />

        {/* Top-left: status + statement */}
        <motion.div {...rise(0.35)} className="absolute left-0 right-0 top-[84px] sm:right-auto sm:top-[9%] sm:max-w-[300px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              {status}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white/60 px-3 py-1.5 text-[11px] text-neutral-600">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-cobalt" />
              {location}
            </span>
          </div>
          <p className="mt-5 text-[13px] font-medium uppercase leading-relaxed tracking-wide text-neutral-700 sm:mt-[18%]">
            I build fast, modern applications with the latest technologies, simple to use and built to last.
          </p>
        </motion.div>

        {/* Bottom-left: title + full name */}
        <motion.div {...rise(0.45, 40)} className="absolute bottom-6 left-0 sm:bottom-[6%]">
          <p className="inline-block rounded bg-[#f3f3f1]/85 px-1.5 py-0.5 font-mono text-xs font-semibold tracking-wider text-cobalt backdrop-blur-sm sm:bg-transparent sm:p-0 sm:backdrop-blur-none">{title}</p>
          <h1 className="mt-1 text-[clamp(56px,10.5vw,150px)] font-black uppercase leading-[0.84] tracking-[-0.06em]">
            Nibin
            <br />
            Nihad<span className="text-cobalt">.</span>
          </h1>
        </motion.div>
      </div>
    </div>
  );
}
