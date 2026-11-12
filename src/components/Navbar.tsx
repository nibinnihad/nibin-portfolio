"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, ArrowUpRight, FileDown } from "lucide-react";
import { portfolioData } from "@/data/portfolio";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Profile", href: "#about" },
    { name: "Skills", href: "#skills" },
    { name: "Experience", href: "#experience" },
    { name: "Projects", href: "#projects" },
    { name: "Education", href: "#education" },
    { name: "Certifications", href: "#certifications" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 motion-reduce:transition-none ${isScrolled
        ? "bg-[#f3f3f1]/90 backdrop-blur-xl border-b border-black/[0.12] py-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.068)]"
        : "bg-transparent py-5"
      }`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <nav aria-label="Main navigation" className="hidden xl:flex items-center space-x-7 text-[11px] font-semibold tracking-[0.16em] uppercase text-neutral-600">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="relative py-1 hover:text-neutral-950 transition-colors motion-reduce:transition-none group"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-px bg-cobalt transition-all duration-200 motion-reduce:transition-none group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="hidden xl:flex items-center space-x-3">
          <a
            href={portfolioData.personal.resumeUrl}
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-cobalt text-cobalt text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-cobalt hover:text-white transition-colors motion-reduce:transition-none"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Resume</span>
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-cobalt text-white text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-cobalt-light transition-colors motion-reduce:transition-none"
          >
            <span>Get In Touch</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          className="xl:hidden ml-auto p-2 text-neutral-700 hover:text-neutral-950 transition-colors motion-reduce:transition-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      </div>

      {mobileMenuOpen && (
        <div id="mobile-navigation" className="xl:hidden fixed inset-x-0 top-[60px] bg-[#f3f3f1]/95 backdrop-blur-xl border-b border-black/[0.12] px-6 py-8 shadow-2xl transition-all motion-reduce:transition-none">
          <nav aria-label="Mobile navigation" className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-neutral-800 hover:text-neutral-950 transition-colors motion-reduce:transition-none py-2 border-b border-black/[0.08]"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <a
                href={portfolioData.personal.resumeUrl}
                download
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-cobalt text-cobalt text-sm font-bold tracking-wider uppercase hover:bg-cobalt hover:text-white transition-all motion-reduce:transition-none"
              >
                <FileDown className="w-4 h-4" />
                <span>Resume</span>
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cobalt text-white text-sm font-bold tracking-wider uppercase hover:bg-cobalt-light transition-all motion-reduce:transition-none"
              >
                <span>Get In Touch</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
