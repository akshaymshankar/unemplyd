"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={!isDark}
      className={`relative inline-flex h-8 w-14 items-center rounded-full border transition-colors duration-500 ${
        isDark
          ? "border-white/20 bg-white/5"
          : "border-ink/15 bg-ink/5"
      } ${className}`}
    >
      <span
        className={`absolute left-1 h-6 w-6 rounded-full transition-transform duration-500 ease-snap flex items-center justify-center ${
          isDark ? "translate-x-0 bg-paper" : "translate-x-6 bg-ink"
        }`}
      >
        {/* Sun / moon glyph, drawn inline — no icon dependency */}
        {isDark ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
              fill="#000000"
            />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4.5" fill="#FAFAFA" />
            <g stroke="#FAFAFA" strokeWidth="1.6" strokeLinecap="round">
              <path d="M12 2.5v2.2M12 19.3v2.2M4.2 12H2M22 12h-2.2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5" />
            </g>
          </svg>
        )}
      </span>
    </button>
  );
}
