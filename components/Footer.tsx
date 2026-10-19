"use client";

import BrandMark from "@/components/BrandMark";
import { useTheme } from "@/components/theme/ThemeProvider";

const LINKS = [
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "Journey", href: "#journey" },
  { label: "Labs", href: "#labs" },
  { label: "Projects", href: "#projects" },
  { label: "Team", href: "#team" },
];

export default function Footer() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <footer
      className={`relative border-t transition-colors duration-500 ${
        isDark ? "bg-ink border-white/10" : "bg-paper border-ink/10"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <div>
          <BrandMark tone={isDark ? "dark" : "light"} height={20} />
          <p className={`mt-4 max-w-xs text-sm ${isDark ? "text-fog" : "text-graphite"}`}>
            Build Beyond The Classroom.
          </p>
        </div>

        <ul
          className={`flex flex-wrap gap-x-8 gap-y-3 font-mono text-[13px] uppercase tracking-wide ${
            isDark ? "text-fog" : "text-graphite"
          }`}
        >
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={`transition-colors duration-300 ${
                  isDark ? "hover:text-paper" : "hover:text-ink"
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div
        className={`max-w-[1440px] mx-auto px-6 md:px-10 pb-8 font-mono text-[11px] uppercase tracking-wide ${
          isDark ? "text-fog/60" : "text-graphite/60"
        }`}
      >
        © {new Date().getFullYear()} unemplyd. Building engineers. Building impact.
      </div>
    </footer>
  );
}
