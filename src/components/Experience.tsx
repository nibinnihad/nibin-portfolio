"use client";

import React from "react";
import { motion } from "framer-motion";
import { portfolioData } from "@/data/portfolio";
import { Calendar, CheckCircle2 } from "lucide-react";
import SectionHeader from "./SectionHeader";

export default function Experience() {
  const { experiences } = portfolioData;

  return (
    <section id="experience" className="relative overflow-hidden border-t border-black/10 bg-[#eaeae7] px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader label="Experience" title="Production" accent="impact.">
          Real-world internship experience delivering production web interfaces for international advisory firm HLB HAMT and data analytics pipelines.
        </SectionHeader>

        {/* One simple card per role, side by side on wide screens */}
        <div className="grid gap-5 lg:grid-cols-2">
          {experiences.map((exp, idx) => (
            <motion.article
              key={exp.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col rounded-3xl border border-black/10 bg-white p-6 transition-colors duration-300 hover:border-cobalt/30 sm:p-8"
            >
              {/* Role, company, dates */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-[-0.02em] text-neutral-950 sm:text-2xl">{exp.role}</h3>
                  <div className="mt-1 text-base font-semibold text-cobalt">@ {exp.company}</div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-black/15 px-3.5 py-1.5 font-mono text-xs text-neutral-800">
                  <Calendar className="h-3.5 w-3.5 text-cobalt" />
                  {exp.duration}
                </span>
              </div>
              {exp.badge && (
                <span className="mt-3 self-start rounded-full bg-cobalt/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-cobalt">
                  {exp.badge}
                </span>
              )}

              <p className="mt-5 text-sm leading-relaxed text-neutral-700 sm:text-base">{exp.description}</p>

              {/* Key responsibilities */}
              <h4 className="mb-3 mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-cobalt">Key responsibilities &amp; deliverables</h4>
              <ul className="space-y-3">
                {exp.bulletPoints.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-neutral-700">
                    <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" />
                    {point}
                  </li>
                ))}
              </ul>

              {(exp.pagesDeveloped ?? exp.deliverables) && (
                <>
                  <h4 className="mb-3 mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-cobalt">
                    {exp.pagesDeveloped ? "Key pages delivered" : "Work delivered"}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(exp.pagesDeveloped ?? exp.deliverables ?? []).map((page) => (
                      <span key={page} className="rounded-lg border border-cobalt/15 bg-cobalt/[0.06] px-2.5 py-1 text-xs font-medium text-neutral-900">
                        {page}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* Stack sits at the bottom so both cards line up */}
              <div className="mt-auto pt-6">
                <h4 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-cobalt">Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {exp.technologies.map((tech) => (
                    <span key={tech} className="rounded-lg border border-black/10 bg-black/[0.04] px-2.5 py-1 font-mono text-[11px] text-neutral-800">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
