import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

// Harus sama dengan key di inline init script (src/app/layout.tsx).
const STORAGE_KEY = "pdbk-theme";

// Sumber kebenaran tema = class di <html> (diterapkan oleh inline init script
// di layout.tsx sebelum paint). Hook ini berlangganan perubahan class tsb,
// jadi semua komponen yang memakainya ikut ter-update saat tema diganti.
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("theme-dark") ? "dark" : "light";
}

// Harus deterministik dan sama dengan default init script ("light").
function getServerSnapshot(): Theme {
  return "light";
}

function applyTheme(next: Theme) {
  const root = document.documentElement;
  root.classList.remove("theme-dark", "theme-light");
  root.classList.add(next === "light" ? "theme-light" : "theme-dark");
  root.style.colorScheme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore (mis. private mode) */
  }
}

function toggle() {
  applyTheme(getSnapshot() === "dark" ? "light" : "dark");
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { theme, toggle };
}
