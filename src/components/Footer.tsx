"use client";

import React from "react";
import { portfolioData } from "@/data/portfolio";
import { ArrowUp } from "lucide-react";

export default function Footer() {
  const { personal } = portfolioData;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-black/10 bg-[#f3f3f1] px-4 py-8 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-[0.12em]">{personal.name}</span>
          <span className="text-[11px] text-neutral-500">
            © {new Date().getFullYear()} <span className="mx-1.5 text-neutral-400">/</span> All rights reserved.
          </span>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500">
          Thank you for scrolling
        </p>

        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll back to top"
          className="inline-flex items-center gap-3 self-start rounded-full border border-black/15 px-4 py-2 text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-neutral-700 transition-colors hover:border-cobalt hover:bg-black/10 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt sm:self-auto"
        >
          <span>Back to top</span>
          <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>
    </footer>
  );
}
