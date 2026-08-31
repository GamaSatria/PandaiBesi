"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "pdbk-theme";

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// --- External store backed by <html> class + localStorage ---
// The class on <html> is the source of truth (the inline init script
// in layout.tsx applies it before paint). We subscribe to class changes
// so any DOM mutation triggers React updates — needed for the case where
// other code (or a different tab) changes the theme.
function subscribe(callback: () => void) {
  if (typeof document === "undefined") return () => {};
  const root = document.documentElement;
  const observer = new MutationObserver(callback);
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("theme-light") ? "light" : "dark";
}

// Server snapshot must be deterministic and match what the inline init
// script will produce before paint (it falls back to "dark" on the server).
function getServerSnapshot(): Theme {
  return "dark";
}

function applyTheme(next: Theme) {
  const root = document.documentElement;
  root.classList.remove("theme-dark", "theme-light");
  root.classList.add(next === "light" ? "theme-light" : "theme-dark");
  root.style.colorScheme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore (e.g. private mode) */
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
  }, []);

  const toggle = useCallback(() => {
    applyTheme(theme === "dark" ? "light" : "dark");
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  // Allow components to render even if provider is missing (e.g. tests).
  // Falls back to a no-op hook that always reports dark.
  if (!ctx) {
    return {
      theme: "dark",
      toggle: () => {},
      setTheme: () => {},
    };
  }
  return ctx;
}