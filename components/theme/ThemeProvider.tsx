"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({
  theme: "dark",
  toggle: () => {},
});

const STORAGE_KEY = "unemplyd-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // unemplyd. is a dark-first brand — default stays dark until we know
  // the visitor's stored choice or system preference say otherwise.
  const [theme, setTheme] = useState<Theme>("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, hydrated]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

/**
 * Resolves a section's rendered polarity against the global theme.
 *
 * Sections alternate dark/light by design (the site's cinematic
 * rhythm), so "light mode" isn't "make everything white" — it's the
 * whole rhythm inverted: what was the dark beat becomes the light
 * beat, and vice versa. Pass each section's default (dark-mode)
 * polarity; this resolves what it should actually render given the
 * visitor's chosen theme.
 */
export function useSectionTone(defaultDark: boolean) {
  const { theme } = useTheme();
  const isDark = theme === "dark" ? defaultDark : !defaultDark;

  return {
    isDark,
    bg: isDark ? "bg-ink" : "bg-paper",
    text: isDark ? "text-paper" : "text-ink",
    sub: isDark ? "text-fog" : "text-graphite",
    logo: (isDark ? "dark" : "light") as "dark" | "light", // surface the logo sits on
  };
}
