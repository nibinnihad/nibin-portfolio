import React from "react";
import HeroStage from "./HeroStage";
import { portfolioData } from "@/data/portfolio";
import {
  ArrowUpRight,
  Award,
  Briefcase,
  FolderGit2,
  Github,
  GraduationCap,
  Linkedin,
  Mail,
} from "lucide-react";

// Short labels so the hero list never truncates.
const PROJECT_META: Record<string, { tech: string; name: string; tagline: string }> = {
  "fintrack-pro": { tech: "React", name: "FinTrack Pro", tagline: "Finance dashboard" },
  "nss-connect": { tech: "Django", name: "NSS Connect", tagline: "Volunteer platform" },
  "bio-cyber-sensor": { tech: "Flutter", name: "Bio-Cyber Sensor", tagline: "IoT gas classifier" },
};

const CORE_STACK = ["Java", "Python", "SQL", "TypeScript", "React", "Next.js", "Docker", "Django"];

const card =
  "rounded-3xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.14)]";

export default function Hero() {
  const { personal, projects, experiences, education } = portfolioData;
  const current = experiences[0];
  const degree = education[0];
  const stats = [
    { value: String(projects.length), label: "Projects built", icon: FolderGit2, href: "#projects" },
    { value: String(experiences.length), label: "Internships", icon: Briefcase, href: "#experience" },
    {
      value: degree.duration.slice(-4),
      label: "B.Tech CSE graduate",
      badge: degree.grade.split("|")[1]?.trim() ?? degree.grade,
      icon: GraduationCap,
      href: "#education",
    },
  ];
  const socials = [
    { href: personal.github, label: "GitHub Profile", icon: Github, external: true },
    { href: personal.linkedin, label: "LinkedIn Profile", icon: Linkedin, external: true },
    { href: `mailto:${personal.email}`, label: "Email Nibin", icon: Mail, external: false },
  ];

  return (
    <section id="hero" aria-label="Introduction" className="relative overflow-hidden bg-[#f3f3f1] px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pt-32">
      {/* Backdrop: dot grid + soft cobalt light */}
      <div
        aria-hidden="true"
        className="absolute inset-0 [background-image:radial-gradient(rgba(0,0,0,0.09)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,black_20%,transparent_75%)]"
      />
      <div aria-hidden="true" className="absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-cobalt/[0.09] blur-[120px]" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ============ Stage: cut-out portrait on the page, editorial layout ============ */}
        <HeroStage
          status={personal.status}
          location={personal.location}
          title={personal.title}
        />

        {/* ============ Intro panel: profile · now · selected work, one panel split by hairlines ============ */}
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-black/[0.06] bg-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.14)] lg:col-span-12 lg:grid-cols-12">
          {/* 01 Profile */}
          <div className="flex flex-col bg-white p-7 sm:p-8 lg:col-span-5">
            <div className="flex items-center justify-between">
              <Eyebrow label="Profile" />
              <a href="#about" className="group inline-flex items-center gap-1 text-xs font-medium text-cobalt">
                Read more <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
            <h2 className="mt-6 text-xl font-bold tracking-[-0.02em] text-neutral-950 sm:text-2xl">Computer Science &amp; Engineering graduate</h2>
            <p className="mt-3 text-pretty text-[15px] leading-relaxed text-neutral-600">{personal.shortBio}</p>
            <div className="mt-auto flex items-center gap-2 pt-7">
              {socials.map(({ href, label, icon: Icon, external }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="grid h-10 w-10 place-items-center rounded-full border border-black/10 text-neutral-700 transition-colors hover:border-cobalt hover:bg-cobalt hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* 02 Now: the one cobalt cell, with the blueprint grid */}
          <a href="#experience" className="group relative flex flex-col overflow-hidden bg-gradient-to-br from-cobalt via-cobalt to-cobalt-deep p-7 text-white sm:p-8 lg:col-span-3">
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:28px_28px]" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/15" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full border border-white/15" />
            <div className="relative flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">Now</span>
              <span className="-my-2.5 grid h-9 w-9 place-items-center rounded-full bg-white text-cobalt transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </span>
            </div>
            <div className="relative mt-6 text-xl font-bold leading-tight tracking-[-0.02em] sm:text-2xl">{current.role}</div>
            <div className="relative mt-1 text-[15px] text-white/70">@ {current.company}</div>
            <div className="relative mt-auto pt-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.16em]">
                <span aria-hidden="true" className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-60 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                Live
              </span>
              <p className="mt-3 text-sm leading-snug text-white/80">Production pages built across the HLB HAMT website.</p>
            </div>
          </a>

          {/* 03 Selected work */}
          <div className="flex flex-col bg-white p-7 sm:p-8 lg:col-span-4">
            <div className="flex items-center justify-between">
              <Eyebrow label="Selected work" />
              <a href="#projects" className="group inline-flex items-center gap-1 text-xs font-medium text-cobalt">
                View all <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
            <ol className="mt-4 divide-y divide-black/[0.06]">
              {projects.map((project) => {
                const meta = PROJECT_META[project.id] ?? { tech: project.technologies[0], name: project.title, tagline: project.category };
                return (
                  <li key={project.id}>
                    <a href="#projects" className="group flex items-baseline gap-4 py-3.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-neutral-950 transition-colors group-hover:text-cobalt">{meta.name}</span>
                        <span className="block truncate text-xs text-neutral-500">{meta.tagline}</span>
                      </span>
                      <span className="font-mono text-[11px] font-medium text-cobalt">{meta.tech}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* ============ Stats: one panel split into cells ============ */}
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-black/[0.06] bg-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.14)] sm:grid-cols-3 lg:col-span-12">
          {stats.map(({ value, label, badge, icon: Icon, href }, i) => {
            const last = i === stats.length - 1;
            return (
              <li key={label} className="flex bg-white">
                <a
                  href={href}
                  aria-label={`${value} ${label}${badge ? `, ${badge}` : ""}`}
                  className="group flex flex-1 flex-col p-6 transition-colors hover:bg-[#fafaf9] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt"
                >
                  <div className="flex items-center justify-between">
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-neutral-400 transition-[color,transform] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cobalt" />
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-cobalt/[0.08] text-cobalt transition-colors group-hover:bg-cobalt group-hover:text-white">
                      <Icon aria-hidden="true" className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-8 flex flex-wrap items-end gap-x-3 gap-y-2">
                    <span className={`text-[clamp(32px,4vw,48px)] font-black leading-none tracking-[-0.04em] ${last ? "text-cobalt" : "text-neutral-950"}`}>{value}</span>
                    {badge && (
                      <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-cobalt px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                        <Award aria-hidden="true" className="h-3.5 w-3.5" /> {badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">{label}</div>
                </a>
              </li>
            );
          })}
        </ul>

        {/* ============ Core stack strip ============ */}
        <div className={`${card} flex flex-col items-center gap-4 px-6 py-5 lg:col-span-12`}>
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-cobalt">Core stack</h2>
          <ul className="flex flex-wrap justify-center gap-2">
            {CORE_STACK.map((t) => (
              <li key={t} className="rounded-full border border-black/[0.08] bg-[#f7f7f5] px-3.5 py-1.5 text-sm font-medium text-neutral-800">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ label }: { label: string }) {
  return <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-cobalt">{label}</span>;
}
