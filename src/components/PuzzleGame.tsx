"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { RotateCcw } from "lucide-react";

/*
 * Swap puzzle: a 3x3 picture with a hidden message. Tap one piece, then another, to swap
 * them. When every piece is home the picture reads in full and confetti fires.
 * Every tile carries a full-size copy of the picture, shifted so only its own ninth shows,
 * which keeps the text sharp (real DOM text, not an image).
 */

const N = 3;
const SOLVED = Array.from({ length: N * N }, (_, i) => i);
// Fixed opening layout (same on server and client), with no piece in its home spot.
const START = [5, 8, 3, 6, 0, 7, 1, 4, 2];

const isSolved = (order: number[]) => order.every((piece, pos) => piece === pos);

function shuffled() {
  let order: number[];
  do {
    order = [...SOLVED];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  } while (order.filter((piece, pos) => piece === pos).length > 1);
  return order;
}

/** The picture the pieces are cut from. Sized to the whole board via container units. */
function Picture() {
  return (
    <div className="relative h-[100cqw] w-[100cqw] select-none overflow-hidden bg-gradient-to-br from-cobalt-light via-cobalt to-cobalt-deep text-white">
      {/* grid + shapes give every piece something to line up */}
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:8.333cqw_8.333cqw]" />
      <div className="absolute -right-[18cqw] -top-[18cqw] h-[62cqw] w-[62cqw] rounded-full border-[1.2cqw] border-white/25" />
      <div className="absolute -bottom-[22cqw] -left-[14cqw] h-[56cqw] w-[56cqw] rounded-full bg-black/25" />
      <div className="absolute left-0 top-[78cqw] h-[0.6cqw] w-full bg-white/30" />
      <span className="absolute left-[5cqw] top-[4cqw] font-mono text-[3.4cqw] font-bold uppercase tracking-[0.2em] text-white/70">{"// Puzzle solved"}</span>
      <span className="absolute right-[5cqw] top-[3cqw] font-mono text-[6cqw] leading-none text-white/60">+</span>

      <div className="absolute inset-x-[6cqw] top-[16cqw]">
        <div className="text-[27cqw] font-black uppercase leading-[0.85] tracking-[-0.06em]">Wow!</div>
        <div className="mt-[3cqw] text-[8.4cqw] font-black uppercase leading-[0.95] tracking-[-0.05em] text-cobalt-soft">
          Congratulations!
        </div>
        <p className="mt-[4cqw] text-[4.3cqw] font-semibold leading-[1.35]">
          Sharp eye, quick thinking.
          <br />
          You&apos;re good at this,
          <br />
          and you&apos;re good to hire me.
        </p>
      </div>

      <div className="absolute inset-x-[5cqw] bottom-[4.5cqw] flex items-end justify-between font-mono text-[3.4cqw] font-bold uppercase tracking-[0.18em]">
        <span>Nibin Nihad</span>
        <span className="text-white/60">Let&apos;s talk</span>
      </div>
    </div>
  );
}

export default function PuzzleGame() {
  const [order, setOrder] = useState(START);
  const [picked, setPicked] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const solved = isSolved(order);

  // Celebrate the moment the last piece lands.
  useEffect(() => {
    if (!solved || moves === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = boardRef.current?.getBoundingClientRect();
    const origin = r
      ? { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight }
      : { x: 0.5, y: 0.6 };
    const colors = ["#2C3480", "#6670D4", "#A9B0F0", "#ffffff", "#111111"];
    confetti({ particleCount: 110, spread: 75, startVelocity: 38, origin, colors, disableForReducedMotion: true });
    const t = setTimeout(() => confetti({ particleCount: 70, spread: 110, startVelocity: 28, origin, colors, disableForReducedMotion: true }), 220);
    return () => clearTimeout(t);
  }, [solved, moves]);

  const tap = (pos: number) => {
    if (solved) return;
    if (picked === null) return setPicked(pos);
    if (picked === pos) return setPicked(null);
    setOrder((o) => {
      const next = [...o];
      [next[picked], next[pos]] = [next[pos], next[picked]];
      return next;
    });
    setMoves((m) => m + 1);
    setPicked(null);
  };

  const restart = () => {
    setOrder(shuffled());
    setPicked(null);
    setMoves(0);
  };

  return (
    <div className="flex flex-col">
      <div ref={boardRef} data-swarm-as="media" className="relative grid aspect-square w-full grid-cols-3 overflow-hidden rounded-xl bg-neutral-900 [container-type:inline-size]">
        {order.map((piece, pos) => {
          const col = piece % N;
          const row = Math.floor(piece / N);
          const isPicked = picked === pos;
          return (
            <motion.button
              key={piece}
              layout
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              type="button"
              onClick={() => tap(pos)}
              disabled={solved}
              aria-label={`Puzzle piece ${piece + 1}, in spot ${pos + 1}${isPicked ? ", selected" : ""}`}
              aria-pressed={isPicked}
              className={`relative overflow-hidden outline-none transition-[box-shadow,filter] duration-200 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cobalt-soft ${
                solved ? "cursor-default" : "cursor-pointer hover:brightness-110"
              } ${isPicked ? "z-10 ring-4 ring-inset ring-white brightness-125" : ""}`}
            >
              <span aria-hidden="true" className="pointer-events-none absolute" style={{ left: `${-col * 100}%`, top: `${-row * 100}%` }}>
                <Picture />
              </span>
              {/* thin seams between pieces until the picture is whole */}
              <span aria-hidden="true" className={`pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/25 transition-opacity duration-500 ${solved ? "opacity-0" : "opacity-100"}`} />
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3" aria-live="polite">
        <span className="text-xs text-neutral-600">
          {solved && moves > 0 ? (
            <span className="font-semibold text-cobalt">Solved in {moves} moves. Nice!</span>
          ) : picked !== null ? (
            "Now tap the piece to swap with."
          ) : (
            <>Tap two pieces to swap them &middot; <span className="font-mono">{moves}</span> moves</>
          )}
        </span>
        <button
          type="button"
          onClick={restart}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/15 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-700 transition-colors hover:border-cobalt hover:text-cobalt"
        >
          <RotateCcw aria-hidden="true" className="h-3 w-3" />
          {solved && moves > 0 ? "Play again" : "Shuffle"}
        </button>
      </div>
    </div>
  );
}
