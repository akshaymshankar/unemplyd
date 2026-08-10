"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BrandMark from "./BrandMark";
import ThemeToggle from "./theme/ThemeToggle";
import MagneticButton from "./motion/MagneticButton";
import { useTheme } from "./theme/ThemeProvider";
import { ease } from "@/lib/tokens";

const LINKS = [
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "Journey", href: "#journey" },
  { label: "Labs", href: "#labs" },
  { label: "Projects", href: "#projects" },
  { label: "Team", href: "#team" },
];

export default function Nav() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
          scrolled
            ? isDark
              ? "bg-ink/70 backdrop-blur-xl border-b border-white/10"
              : "bg-paper/70 backdrop-blur-xl border-b border-ink/10"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <nav className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-10 h-20">
          <a href="#top" aria-label="unemplyd. home">
            <BrandMark tone={isDark ? "dark" : "light"} height={20} priority />
          </a>

          <ul
            className={`hidden md:flex items-center gap-9 font-mono text-[13px] uppercase tracking-wide ${
              isDark ? "text-fog" : "text-graphite"
            }`}
          >
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`relative py-1 transition-colors duration-300 group ${
                    isDark ? "hover:text-paper" : "hover:text-ink"
                  }`}
                >
                  {link.label}
                  <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-signal transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <MagneticButton
              href="#begin"
              className="inline-flex items-center gap-2 rounded-full border border-signal bg-signal px-5 py-2.5 text-[13px] font-mono uppercase tracking-wide text-paper"
            >
              Begin Your Journey
            </MagneticButton>
          </div>

          <div className="flex md:hidden items-center gap-4">
            <ThemeToggle />
            <button
              className={`font-mono text-[13px] uppercase tracking-wide ${
                isDark ? "text-paper" : "text-ink"
              }`}
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              Menu
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: ease.out }}
            className={`fixed inset-0 z-[60] flex flex-col ${
              isDark ? "bg-ink" : "bg-paper"
            }`}
          >
            <div className="flex items-center justify-between px-6 h-20">
              <BrandMark tone={isDark ? "dark" : "light"} height={20} />
              <button
                className={`font-mono text-[13px] uppercase tracking-wide ${
                  isDark ? "text-paper" : "text-ink"
                }`}
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                Close
              </button>
            </div>

            <ul className="flex-1 flex flex-col justify-center gap-2 px-6">
              {LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.08 * i, ease: ease.out }}
                >
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`font-display text-5xl ${
                      isDark ? "text-paper" : "text-ink"
                    }`}
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>

            <div className="px-6 pb-10">
              <a
                href="#begin"
                onClick={() => setMenuOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-full bg-signal px-6 py-4 font-mono text-[13px] uppercase tracking-wide text-paper"
              >
                Begin Your Journey
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
