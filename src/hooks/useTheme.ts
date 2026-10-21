import { useEffect } from "react";
import { useSettings } from "./useSettings";

export function useTheme() {
  const { theme, setTheme } = useSettings();

  useEffect(() => {
    const htmlElement = document.documentElement;

    // Determine effective theme
    const effectiveTheme: "light" | "dark" =
      theme === "auto"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    // Apply dark class
    if (effectiveTheme === "dark") {
      htmlElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }

    void window.electronAPI?.syncNativeGlassAppearance?.(effectiveTheme);

    // Listen for system preference changes (only when auto)
    if (theme === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        const nextAppearance = e.matches ? "dark" : "light";
        if (e.matches) {
          htmlElement.classList.add("dark");
          document.body.classList.add("dark");
        } else {
          htmlElement.classList.remove("dark");
          document.body.classList.remove("dark");
        }
        void window.electronAPI?.syncNativeGlassAppearance?.(nextAppearance);
      };

      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  return { theme, setTheme };
}
