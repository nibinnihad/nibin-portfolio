"use client";

import React from "react";
import { motion } from "framer-motion";

/** Shared section title: label eyebrow, white headline, cobalt accent phrase. */
export default function SectionHeader({ label, title, accent, children }: { label: string; title: string; accent: string; children?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
    >
      <div>
        <span className="mb-3 block font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-cobalt">
          {"//"} {label}
        </span>
        <h2 className="text-4xl font-black uppercase leading-[0.95] tracking-[-0.05em] text-neutral-950 sm:text-6xl">
          {title} <span className="text-cobalt">{accent}</span>
        </h2>
      </div>
      {children && <div className="max-w-md text-sm leading-relaxed text-neutral-600">{children}</div>}
    </motion.div>
  );
}
