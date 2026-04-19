"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "um_theme";

export type ThemePreference = "light" | "dark" | "auto";

type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ThemePreference;
  setTheme: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function parseStoredPreference(raw: string | null): ThemePreference | null {
  if (raw === "light" || raw === "dark" || raw === "auto") return raw;
  return null;
}

/**
 * Resolves the effective light/dark appearance for the document.
 * Auto: prefers OS via matchMedia when available; otherwise 18:00–06:00 → dark.
 */
export function resolveResolvedTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";

  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      /* fall through to time-based */
    }
  }

  const hour = new Date().getHours();
  return hour >= 18 || hour < 6 ? "dark" : "light";
}

function applyHtmlClass(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemePreference>("auto");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = parseStoredPreference(window.localStorage.getItem(STORAGE_KEY));
    const initial: ThemePreference = stored ?? "auto";
    setTheme(initial);
    applyHtmlClass(resolveResolvedTheme(initial));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(STORAGE_KEY, theme);
    applyHtmlClass(resolveResolvedTheme(theme));
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted || theme !== "auto") return;

    if (typeof window.matchMedia === "function") {
      let mq: MediaQueryList;
      try {
        mq = window.matchMedia("(prefers-color-scheme: dark)");
      } catch {
        const id = window.setInterval(() => {
          applyHtmlClass(resolveResolvedTheme("auto"));
        }, 60_000);
        return () => window.clearInterval(id);
      }

      const sync = () => applyHtmlClass(resolveResolvedTheme("auto"));
      sync();
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }

    const id = window.setInterval(() => {
      applyHtmlClass(resolveResolvedTheme("auto"));
    }, 60_000);
    return () => window.clearInterval(id);
  }, [theme, mounted]);

  const setThemePreference = useCallback((next: ThemePreference) => {
    setTheme(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
