"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "maatiilink-theme";

function readThemeFromDom(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function subscribeToTheme(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("maatiilink-theme-change", onStoreChange);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("maatiilink-theme-change", onStoreChange);
  };
}

function applyTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  document.documentElement.style.colorScheme = next;
  localStorage.setItem(STORAGE_KEY, next);
  window.dispatchEvent(
    new CustomEvent("maatiilink-theme-change", { detail: next }),
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore<Theme>(
    subscribeToTheme,
    readThemeFromDom,
    (): Theme => "light",
  );

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme(readThemeFromDom() === "light" ? "dark" : "light");
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function getThemeSnapshot(): Theme {
  return readThemeFromDom();
}
