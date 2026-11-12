"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { MotionGlobalConfig } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { SWARM_PENDING_ATTR } from "./constants";
import type { SwarmEngine } from "./engine";

/**
 * While the swarm builds, it is the page's entrance: the sections' own fade/slide-in
 * animations finish instantly so the two never fight. Set at module load, before React
 * hydrates and the first animations start, whenever this visit will auto-play the rebuild.
 */
const holdPageMotion = (on: boolean) => {
  MotionGlobalConfig.instantAnimations = on;
};
if (typeof document !== "undefined" && document.documentElement.hasAttribute(SWARM_PENDING_ATTR)) holdPageMotion(true);

type Mode = "off" | "running" | "done";

/**
 * Mounts the swarm rebuild. Auto-plays when the pre-paint script opted this
 * visit in (first visit of the session); otherwise only offers Replay.
 * The engine is loaded lazily so it never weighs on the initial bundle.
 */
export default function SwarmRebuild() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SwarmEngine | null>(null);
  const [mode, setMode] = useState<Mode>("off");
  const [runId, setRunId] = useState(0);
  const [footerInView, setFooterInView] = useState(false);

  // The footer has its own controls in that corner; step aside while it is on screen.
  useEffect(() => {
    const footer = document.querySelector("body footer");
    if (!footer) return;
    const io = new IntersectionObserver(([entry]) => setFooterInView(entry.isIntersecting));
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const pending = document.documentElement.hasAttribute(SWARM_PENDING_ATTR);
    setMode(pending ? "running" : "done");
    if (!pending) holdPageMotion(false);
  }, []);

  useEffect(() => {
    if (mode !== "running") return;
    holdPageMotion(true);
    let cancelled = false;
    let engine: SwarmEngine | null = null;

    import("./engine")
      .then(({ SwarmEngine: Engine }) => {
        if (cancelled || !canvasRef.current) return;
        engine = new Engine(canvasRef.current, {
          onStatus: () => {},
          onFinish: () => {
            holdPageMotion(false);
            setMode("done");
          },
        });
        engineRef.current = engine;
        engine.start();
      })
      .catch((error) => {
        console.error("[swarm] failed to load", error);
        document.documentElement.removeAttribute(SWARM_PENDING_ATTR);
        holdPageMotion(false);
        setMode("done");
      });

    return () => {
      cancelled = true;
      holdPageMotion(false);
      engine?.destroy();
      engineRef.current = null;
    };
  }, [mode, runId]);

  const skip = useCallback(() => {
    engineRef.current?.skip();
  }, []);

  const replay = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    holdPageMotion(true);
    setRunId((current) => current + 1);
    setMode("running");
  }, []);

  useEffect(() => {
    if (mode !== "running") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, skip]);

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {mode === "running" ? "Portfolio rebuild animation playing. Press Escape to skip." : ""}
      </p>

      {mode === "running" && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[55] h-full w-full"
        />
      )}

      {mode === "done" && (
        <button
          type="button"
          onClick={replay}
          aria-label="Replay the portfolio rebuild animation"
          className={`swarm-fade-in fixed bottom-4 right-4 z-[70] inline-flex items-center transition-[opacity,transform,color,border-color] duration-300 ${footerInView ? "pointer-events-none translate-y-2 opacity-0" : ""} gap-1.5 rounded-full border border-white/15 bg-[#09090b]/90 p-2.5 font-mono sm:px-3 text-[10px] font-bold uppercase tracking-normal text-neutral-300 shadow-[0_12px_42px_rgba(0,0,0,0.5)] backdrop-blur-xl hover:border-white/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
          tabIndex={footerInView ? -1 : 0}
        >
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
          <span className="hidden sm:inline">Replay build</span>
        </button>
      )}
    </>
  );
}
