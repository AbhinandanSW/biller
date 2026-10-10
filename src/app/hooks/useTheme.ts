"use client";

import { useSyncExternalStore } from "react";

import { THEME_CHANGE_EVENT, THEME_STORAGE_KEY } from "@/constants/theme";

export type Theme = "light" | "dark";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

/** The theme on screen: the saved choice, otherwise the system setting. */
function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** Saves the choice and applies it to the page (globals.css reads data-theme). */
function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the choice lasts for this page only.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/** Current theme (null until mounted, since the server can't know it) and a setter. */
export function useTheme(): { theme: Theme | null; setTheme: (theme: Theme) => void } {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => null);
  return { theme, setTheme };
}
