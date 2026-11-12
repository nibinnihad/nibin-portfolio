import React from "react";
import HeroStage from "./HeroStage";
import { portfolioData } from "@/data/portfolio";
import {
  ArrowUpRight,
  Award,
  BarChart3,
  Briefcase,
  Cpu,
  FolderGit2,
  Github,
  GraduationCap,
  Linkedin,
  Mail,
  Users,
} from "lucide-react";

// Short labels so the hero list never truncates.
const PROJECT_META: Record<string, { icon: typeof BarChart3; tech: string; name: string; tagline: string }> = {
  "fintrack-pro": { icon: BarChart3, tech: "React", name: "FinTrack Pro", tagline: "Finance dashboard" },
  "nss-connect": { icon: Users, tech: "Django", name: "NSS Connect", tagline: "Volunteer platform" },
  "bio-cyber-sensor": { icon: Cpu, tech: "Flutter", name: "Bio-Cyber Sensor", tagline: "IoT gas classifier" },
};

const CORE_STACK = ["Java", "Python", "SQL", "TypeScript", "React", "Next.js", "Docker", "Django"];

const card =
  "rounded-3xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.14)]";

export default function Hero() {
  const { personal, projects, experiences, education } = portfolioData;
  const current = experiences[0];
  const degree = education[0];
  const stats = [
    { value: String(projects.length), label: "Projects built", icon: FolderGit2 },
    { value: String(experiences.length), label: "Internships", icon: Briefcase },
    { value: degree.duration.slice(-4), label: "B.Tech CSE", icon: GraduationCap },
    { value: degree.grade.split("|")[1]?.trim() ?? degree.grade, label: "Graduated", icon: Award },
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

        {/* ============ About ============ */}
        <div className={`${card} flex flex-col justify-between p-7 lg:col-span-4`}>
          <div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-cobalt">Computer Science &amp; Engineering graduate</div>
              <a href="#about" aria-label="Read profile" className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/10 text-neutral-500 transition-colors hover:border-cobalt hover:text-cobalt">
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
            <p className="mt-4 text-pretty text-center text-sm leading-relaxed text-cobalt">{personal.shortBio}</p>
          </div>
          <div className="mt-6 flex items-center gap-2">
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

        {/* ============ Currently ============ */}
        <a
          href="#experience"
          className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-cobalt via-cobalt to-cobalt-deep p-7 text-white shadow-[0_24px_60px_-20px_rgba(44,52,128,0.6)] lg:col-span-4"
        >
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:28px_28px]" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/15" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full border border-white/15" />
          <div className="relative flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em]">
              <Briefcase aria-hidden="true" className="h-3.5 w-3.5" /> Currently
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-cobalt">
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </span>
          </div>
          <div className="relative">
            <div className="text-2xl font-bold leading-tight">{current.role}</div>
            <div className="mt-1 text-white/70">@ {current.company}</div>
            <div className="mt-6 flex items-end gap-3 border-t border-white/20 pt-5">
              <span className="text-5xl font-black leading-none tracking-[-0.04em]">Live</span>
              <span className="pb-1 text-sm leading-tight text-white/80">
                production pages built
                <br />
                across the HLB HAMT website
              </span>
            </div>
          </div>
        </a>

        {/* ============ Featured work ============ */}
        <div className={`${card} p-6 lg:col-span-4`}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-950">Featured Work</h2>
            <a href="#projects" className="-my-2 py-2 text-xs font-medium text-cobalt hover:underline">
              View all
            </a>
          </div>
          <ul className="divide-y divide-black/[0.06]">
            {projects.map((project) => {
              const meta = PROJECT_META[project.id] ?? { icon: Briefcase, tech: project.technologies[0], name: project.title, tagline: project.category };
              const Icon = meta.icon;
              return (
                <li key={project.id}>
                  <a href="#projects" className="group flex items-center gap-3 py-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f3f3f1] text-neutral-800 transition-colors group-hover:bg-cobalt group-hover:text-white">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-neutral-950">{meta.name}</span>
                      <span className="block truncate text-xs text-neutral-500">{meta.tagline}</span>
                    </span>
                    <span className="rounded-full border border-cobalt/20 bg-cobalt/[0.06] px-2.5 py-0.5 font-mono text-[11px] font-medium text-cobalt">{meta.tech}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ============ Stats: one panel split into cells ============ */}
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-black/[0.06] bg-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.14)] lg:col-span-12 lg:grid-cols-4">
          {stats.map(({ value, label, icon: Icon }, i) => {
            const last = i === stats.length - 1;
            return (
              <li key={label} className="group flex flex-col bg-white p-6 transition-colors hover:bg-[#fafaf9]">
                <div className="flex items-center justify-end">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-cobalt/[0.08] text-cobalt transition-colors group-hover:bg-cobalt group-hover:text-white">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                </div>
                <div className={`mt-8 text-[clamp(32px,4vw,48px)] font-black leading-none tracking-[-0.04em] ${last ? "text-cobalt" : "text-neutral-950"}`}>{value}</div>
                <div className="mt-3 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">{label}</div>
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
