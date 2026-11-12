"use client";

import React from "react";
import { portfolioData } from "@/data/portfolio";
import { Award, Brain, Calendar, MessagesSquare, Puzzle, TrendingUp } from "lucide-react";
import SectionHeader from "./SectionHeader";
import TiltCard from "./TiltCard";

const PERSONAL_ICONS = [Puzzle, Brain, TrendingUp, MessagesSquare];

export default function Certifications() {
  const { certifications, personalSkills } = portfolioData;

  return (
    <section id="certifications" className="relative overflow-hidden border-t border-black/10 bg-[#f3f3f1] px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader label="Certifications & Achievements" title="Certifications &" accent="achievements." />

        <div className="grid gap-5">
          {certifications.map((cert, i) => (
            <TiltCard key={cert.title} delay={0.1 * i} className="bg-[#ffffff] p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cobalt text-white shadow-[0_10px_30px_rgba(44,52,128,0.25)]">
                  <Award className="h-7 w-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">Certification</span>
                  <h3 className="mt-1 text-lg font-black uppercase tracking-[-0.01em] text-neutral-950 sm:text-xl">{cert.title}</h3>
                  <p className="mt-1 font-mono text-xs text-neutral-600">{cert.issuer}</p>
                  {cert.description && <p className="mt-3 text-sm leading-relaxed text-neutral-700">{cert.description}</p>}
                </div>
                <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-black/15 px-3.5 py-1.5 font-mono text-xs text-neutral-800 sm:self-center">
                  <Calendar className="h-3.5 w-3.5 text-cobalt" />
                  {cert.year}
                </span>
              </div>
            </TiltCard>
          ))}
        </div>

        {/* Personal skills */}
        <h3 className="mb-5 mt-16 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-cobalt">
          {"//"} Personal skills
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {personalSkills.map((skill, i) => {
            const Icon = PERSONAL_ICONS[i % PERSONAL_ICONS.length];
            return (
              <TiltCard key={skill} delay={0.08 * i} className="bg-[#ffffff] p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-cobalt/20 bg-cobalt/[0.06] text-cobalt">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <div className="mt-6 text-base font-bold leading-snug text-neutral-950">{skill}</div>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
