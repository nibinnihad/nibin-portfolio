"use client";

import React from "react";
import { portfolioData } from "@/data/portfolio";
import { Calendar, GraduationCap } from "lucide-react";
import SectionHeader from "./SectionHeader";
import TiltCard from "./TiltCard";

export default function Education() {
  const { education } = portfolioData;
  const [degree, ...school] = education;

  return (
    <section id="education" className="relative overflow-hidden border-t border-black/10 bg-[#eaeae7] px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader label="Education" title="Academic" accent="foundation." />

        <div className="grid gap-5 lg:grid-cols-12">
          {/* Degree: the headline card */}
          <div className="lg:col-span-7 lg:row-span-2">
            <TiltCard className="bg-gradient-to-br from-cobalt via-cobalt-deep to-black p-7 sm:p-10">
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-8 select-none text-[220px] font-black leading-none tracking-[-0.08em] text-white/[0.05]">
                {degree.duration.slice(-4)}
              </div>
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-black/30 text-white">
                    <GraduationCap className="h-6 w-6" />
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3.5 py-1.5 font-mono text-xs text-white">
                    <Calendar className="h-3.5 w-3.5" />
                    {degree.duration}
                  </span>
                </div>
                <h3 className="mt-8 text-2xl font-black uppercase leading-tight tracking-[-0.02em] text-white sm:text-4xl">{degree.degree}</h3>
                <p className="mt-2 font-mono text-sm text-cobalt-soft">{degree.institution}</p>
                {degree.details && <p className="mb-8 mt-6 max-w-lg text-sm leading-relaxed text-white/75">{degree.details}</p>}
                <div className="mt-auto inline-flex self-start rounded-2xl border border-white/20 bg-black/40 px-5 py-3 font-mono text-sm font-bold text-white">
                  {degree.grade}
                </div>
              </div>
            </TiltCard>
          </div>

          {school.map((edu, i) => (
            <div key={edu.degree} className="lg:col-span-5">
              <TiltCard delay={0.1 * (i + 1)} className="bg-[#ffffff] p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-neutral-950 sm:text-lg">{edu.degree}</h3>
                    <p className="mt-1 font-mono text-xs text-neutral-600">{edu.institution}</p>
                  </div>
                  <span className="shrink-0 text-2xl font-black text-neutral-950">{edu.duration.slice(-4)}</span>
                </div>
                {edu.details && <p className="mt-3 text-sm text-neutral-600">{edu.details}</p>}
                <div className="mt-4 flex items-center justify-between font-mono text-xs">
                  <span className="rounded-md border border-cobalt/20 bg-cobalt/25 px-2.5 py-1 font-bold text-cobalt-deep">{edu.grade}</span>
                  <span className="text-neutral-500">{edu.duration}</span>
                </div>
              </TiltCard>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
