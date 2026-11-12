import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SWARM_ENABLED, SWARM_PREPAINT_SCRIPT } from "@/components/swarm/constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nibin Nihad | Software Developer",
  description:
    "Personal developer portfolio of Nibin Nihad — Computer Science and Engineering graduate and Software Developer working with Python, Java, React.js and Django.",
  keywords: [
    "Nibin Nihad",
    "Software Developer",
    "Frontend Developer",
    "Next.js Developer",
    "React Developer",
    "Python Developer",
    "Software Engineer",
    "Portfolio",
    "Kerala",
    "India",
  ],
  authors: [{ name: "Nibin Nihad" }],
  creator: "Nibin Nihad",
  openGraph: {
    title: "Nibin Nihad | Software Developer",
    description:
      "Software Developer building modern web applications with React, Next.js, TypeScript, and Python.",
    url: "https://nibinnihad.dev",
    siteName: "Nibin Nihad Portfolio",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {SWARM_ENABLED && <script dangerouslySetInnerHTML={{ __html: SWARM_PREPAINT_SCRIPT }} />}
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col bg-[#f3f3f1] text-neutral-950 selection:bg-cobalt selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
