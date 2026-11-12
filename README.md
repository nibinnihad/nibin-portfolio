# Nibin Nihad — Personal Developer Portfolio

> A responsive, monochrome single-page personal portfolio built with Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide React, and Motion.

## 🚀 Live Demo & Deployment
- Built for deployment on **Vercel**.
- All portfolio content is managed centrally in [`src/data/portfolio.ts`](./src/data/portfolio.ts).

---

## 🛠️ Tech Stack
- **Framework:** Next.js (App Router)
- **UI & Architecture:** React 19, TypeScript
- **Styling:** Tailwind CSS (monochrome dark theme)
- **Icons:** Lucide React
- **Animations:** Motion (Framer Motion)
- **Fonts:** Inter & JetBrains Mono (via `next/font`)

---

## 📁 Project Architecture & Components

```
src/
├── app/
│   ├── layout.tsx         # HTML shell, metadata, and font imports
│   ├── page.tsx           # Single-page layout composing all sections
│   └── globals.css        # Tailwind directives, theme variables, glass styling
├── components/
│   ├── Navbar.tsx         # Responsive navbar with mobile menu
│   ├── Hero.tsx           # Name, title, status, intro, resume & project CTAs
│   ├── About.tsx          # Educational narrative, career goals, highlight cards
│   ├── Experience.tsx     # Bairuha Tech (HLB HAMT pages) & CodeMe Hub
│   ├── Projects.tsx       # FinTrack Pro, NSS Connect, Bio-Cyber Sensor with detail modals
│   ├── Skills.tsx         # Categorized skills matrix (no fake percentages)
│   ├── Education.tsx      # B.Tech First Class & Higher Secondary qualifications
│   ├── Certifications.tsx # NIELIT Calicut Drone Boot Camp
│   ├── Contact.tsx        # Direct contact info, 1-click email copy, client-side email form
│   └── Footer.tsx         # Monogram, copyright, tech credits, back-to-top button
└── data/
    └── portfolio.ts       # Single source of truth for all editable content
```

---

## 🏃 Getting Started

### Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to view the portfolio.

### Production Build
```bash
npm run build
npm run start
```
