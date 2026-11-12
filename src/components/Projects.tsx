"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { portfolioData, type Project } from "@/data/portfolio";
import { ArrowUpRight, CheckCircle2, Github, Sparkles } from "lucide-react";
import SectionHeader from "./SectionHeader";

/*
 * Stacking panels: each project pins under the navbar while the next one
 * slides over it; panels underneath shrink and dim so the stack reads as depth.
 */
export default function Projects() {
  const { projects } = portfolioData;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section id="projects" className="relative border-t border-black/10 bg-[#f3f3f1] px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader label="Projects" title="Projects that" accent="speak." />
        <div ref={ref} className="relative">
          {projects.map((project, i) => (
            <ProjectPanel key={project.id} project={project} i={i} count={projects.length} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectPanel({ project, i, count, progress }: { project: Project; i: number; count: number; progress: MotionValue<number> }) {
  const start = i / count;
  const scale = useTransform(progress, [start, 1], [1, 1 - (count - 1 - i) * 0.05]);
  const dim = useTransform(progress, [start, Math.min(1, start + 1 / count)], [0, i === count - 1 ? 0 : 0.5]);

  return (
    <div className="sticky top-20 pb-8 sm:top-24" style={{ zIndex: i + 1 }}>
      <motion.article
        style={{ scale, transformOrigin: "top center" }}
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-black/10 bg-[#ffffff] shadow-[0_-20px_60px_rgba(0,0,0,0.1)]"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cobalt/[0.06] blur-[90px]" />
        <motion.div aria-hidden="true" style={{ opacity: dim }} className="pointer-events-none absolute inset-0 z-20 bg-white" />

        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-12 lg:gap-12">
          {/* Left: identity */}
          <div className="flex flex-col lg:col-span-5">
            <span className="self-start rounded-full border border-cobalt/20 bg-cobalt/25 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-cobalt">
              {project.category}
            </span>
            <h3 className="mt-6 text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-neutral-950 sm:text-5xl">{project.title}</h3>
            <p className="mt-2 font-mono text-xs uppercase tracking-wider text-neutral-600">{project.subtitle}</p>
            <p className="mt-6 text-sm leading-relaxed text-neutral-700 sm:text-base">{project.description}</p>

            <div className="mt-auto pt-8">
              <div className="flex flex-wrap gap-1.5">
                {project.technologies.map((t) => (
                  <span key={t} className="rounded-md border border-black/10 bg-black/[0.04] px-2.5 py-1 font-mono text-[11px] text-neutral-800">
                    {t}
                  </span>
                ))}
              </div>
              {(project.githubUrl || project.liveUrl) && (
                <div className="mt-5 flex gap-3">
                  {project.githubUrl && (
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-950 hover:text-cobalt">
                      <Github className="h-4 w-4" /> Source
                    </a>
                  )}
                  {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-950 hover:text-cobalt">
                      Live <ArrowUpRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: features + engineering highlights */}
          <div className="grid gap-4 lg:col-span-7">
            <div className="rounded-2xl border border-black/10 bg-black/[0.025] p-5 sm:p-6">
              <h4 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-cobalt">What it does</h4>
              <ul className="grid gap-3 sm:grid-cols-2">
                {project.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm leading-snug text-neutral-700">
                    <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-cobalt-bright/30 bg-gradient-to-br from-cobalt to-cobalt-deep p-5 sm:p-6">
              <h4 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">How I built it</h4>
              <ul className="grid gap-3">
                {project.highlights.map((h) => (
                  <li key={h} className="flex gap-2.5 text-sm font-medium leading-snug text-white">
                    <Sparkles aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-cobalt-soft" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  );
}
