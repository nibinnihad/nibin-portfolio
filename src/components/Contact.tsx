"use client";

import React, { useState } from "react";
import { portfolioData } from "@/data/portfolio";
import {
  Copy,
  Check,
  Send,
  ArrowUpRight,
  Mail,
  Phone,
  MapPin,
  Globe2,
} from "lucide-react";
import PuzzleGame from "./PuzzleGame";

export default function Contact() {
  const { personal } = portfolioData;
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(personal.email);
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
      setCopyError(true);
      window.setTimeout(() => setCopyError(false), 2500);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoUrl = `mailto:${personal.email}?subject=${encodeURIComponent(
      formData.subject || `Message from ${formData.name || "Portfolio Visitor"}`
    )}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;
    window.location.href = mailtoUrl;
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden border-t border-black/10 bg-[#eaeae7] px-4 py-16 sm:py-24 text-neutral-950 sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(255,255,255,0.73),transparent_50%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-12 grid gap-8 border-b border-black/10 pb-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <span className="mb-3 block font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-cobalt">
              {"//"} Direct communication
            </span>
            <h2 className="max-w-3xl text-4xl font-semibold uppercase leading-[0.96] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Let&apos;s make
              <br />
              <span className="text-cobalt">something matter.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-neutral-600 md:pb-1">
            Interested in building high-performance web applications, scalable platforms, or practical software solutions? Let&apos;s connect.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <article className="group relative rounded-2xl border border-black/10 bg-white px-5 py-4 text-center transition-colors hover:border-cobalt hover:bg-cobalt/[0.04]">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">Email address</span>
                  <Mail aria-hidden="true" className="h-4 w-4 text-neutral-500" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <a href={`mailto:${personal.email}`} className="-my-2 truncate py-2 text-sm font-medium text-neutral-900 transition-colors hover:text-neutral-950">
                    {personal.email}
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    aria-label={copied ? "Email address copied" : copyError ? "Unable to copy email address" : "Copy email address"}
                    className="shrink-0 rounded-md p-2 text-neutral-500 transition-colors hover:bg-black/10 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                  >
                    {copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
                  </button>
                </div>
                <span className="pointer-events-none absolute inset-x-0 bottom-1.5 text-[10px] text-neutral-500" role="status" aria-live="polite">
                  {copied ? "Email copied to clipboard." : copyError ? "Copy failed. Select the address to copy it manually." : ""}
                </span>
              </article>

              <article className="relative rounded-2xl border border-black/10 bg-white px-5 py-4 text-center transition-colors hover:border-cobalt hover:bg-cobalt/[0.04]">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">Phone / WhatsApp</span>
                  <Phone aria-hidden="true" className="h-4 w-4 text-neutral-500" />
                </div>
                <a href={`tel:${personal.phone.replace(/\s+/g, "")}`} className="-my-2 py-2 text-sm font-medium text-neutral-900 transition-colors hover:text-neutral-950">
                  {personal.phone}
                </a>
              </article>

              <article className="relative rounded-2xl border border-black/10 bg-white px-5 py-4 text-center transition-colors hover:border-cobalt hover:bg-cobalt/[0.04]">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">Location</span>
                  <MapPin aria-hidden="true" className="h-4 w-4 text-neutral-500" />
                </div>
                <span className="text-sm font-medium text-neutral-900">{personal.location}</span>
              </article>

              <article className="relative rounded-2xl border border-black/10 bg-white px-5 py-4 text-center transition-colors hover:border-cobalt hover:bg-cobalt/[0.04]">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">Online profiles</span>
                  <Globe2 aria-hidden="true" className="h-4 w-4 text-neutral-500" />
                </div>
                <div className="flex items-center justify-center gap-5">
                  <a href={personal.linkedin} target="_blank" rel="noopener noreferrer" className="-my-2 inline-flex items-center gap-1.5 py-2 text-sm font-medium text-neutral-800 transition-colors hover:text-neutral-950">
                    LinkedIn <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 text-neutral-500" />
                  </a>
                  <a href={personal.github} target="_blank" rel="noopener noreferrer" className="-my-2 inline-flex items-center gap-1.5 py-2 text-sm font-medium text-neutral-800 transition-colors hover:text-neutral-950">
                    GitHub <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 text-neutral-500" />
                  </a>
                </div>
              </article>
            </div>

            <form onSubmit={handleSubmitForm} className="rounded-2xl border border-black/10 bg-[#ffffff] p-5 sm:p-7">
              <div className="mb-6 border-b border-black/10 pb-4">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">Start a conversation</span>
                <h3 className="text-lg font-medium tracking-tight">Send a message</h3>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">Your name</label>
                  <input id="contact-name" type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" className="w-full rounded-lg border border-black/10 bg-black/[0.025] px-3.5 py-3 text-sm text-neutral-950 placeholder:text-neutral-400 transition-colors focus:border-cobalt/60 focus:outline-none focus:ring-1 focus:ring-cobalt/20" />
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">Your email</label>
                  <input id="contact-email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" className="w-full rounded-lg border border-black/10 bg-black/[0.025] px-3.5 py-3 text-sm text-neutral-950 placeholder:text-neutral-400 transition-colors focus:border-cobalt/60 focus:outline-none focus:ring-1 focus:ring-cobalt/20" />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="contact-subject" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">Subject</label>
                <input id="contact-subject" type="text" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Opportunity or project" className="w-full rounded-lg border border-black/10 bg-black/[0.025] px-3.5 py-3 text-sm text-neutral-950 placeholder:text-neutral-400 transition-colors focus:border-cobalt/60 focus:outline-none focus:ring-1 focus:ring-cobalt/20" />
              </div>
              <div className="mb-6">
                <label htmlFor="contact-message" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">Message</label>
                <textarea id="contact-message" required rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="Write your message here..." className="w-full resize-none rounded-lg border border-black/10 bg-black/[0.025] px-3.5 py-3 text-sm text-neutral-950 placeholder:text-neutral-400 transition-colors focus:border-cobalt/60 focus:outline-none focus:ring-1 focus:ring-cobalt/20" />
              </div>
              <div>
                <button type="submit" className="inline-flex w-full items-center sm:w-auto justify-center gap-2 rounded-lg bg-cobalt px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-cobalt-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-bright">
                  <Send aria-hidden="true" className="h-3.5 w-3.5" />
                  <span>Send message</span>
                </button>
              </div>
            </form>
          </div>

          <aside className="relative flex min-h-[440px] flex-col justify-between overflow-hidden rounded-2xl border border-black/10 bg-[#ffffff] p-6 sm:p-8 lg:col-span-5">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.063),transparent_55%)]" />
            <div className="relative">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">{"// Mini game"}</span>
              <h3 className="text-2xl font-semibold uppercase leading-tight tracking-[-0.04em] sm:text-3xl">
                Thank you for <span className="text-cobalt">scrolling.</span>
              </h3>
              <p className="mt-3 max-w-sm text-xs leading-5 text-neutral-600">
                Now let&apos;s play a game. Win this if you can!
              </p>
            </div>

            <div className="relative my-6">
              <PuzzleGame />
            </div>

            <div className="relative flex items-center justify-between gap-3 border-t border-black/10 pt-4">
              <span className="text-xs text-neutral-600">Ready to build something useful.</span>
              <a href={`mailto:${personal.email}`} className="-my-2 inline-flex shrink-0 items-center gap-1.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-950 transition-colors hover:text-neutral-600">
                Hire me <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
