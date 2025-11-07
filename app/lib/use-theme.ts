import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/**
 * Get the resolved theme based on user preference and system preference
 */
function getResolvedTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    // Check system preference
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light"; // Default fallback
  }
  return theme;
}

/**
 * Hook to manage theme state and system preference changes
 */
export function useTheme(initialTheme: Theme = "system") {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  // Initialize with a safe default to avoid hydration mismatch
  // The real value will be set in useEffect on the client
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  // Update resolved theme when theme changes (runs on mount and when theme changes)
  useEffect(() => {
    setResolvedTheme(getResolvedTheme(theme));
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Listen for custom theme change events
  useEffect(() => {
    const handleThemeChange = (e: CustomEvent) => {
      const newTheme = e.detail.theme as Theme;
      setTheme(newTheme);
    };

    window.addEventListener("themechange", handleThemeChange as EventListener);
    return () => {
      window.removeEventListener("themechange", handleThemeChange as EventListener);
    };
  }, []);

  // Apply theme class to document element and sync to localStorage
  useEffect(() => {
    const root = document.documentElement;

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Store in localStorage for initial load
    try {
      localStorage.setItem("wallie-theme", theme);
    } catch (e) {
      console.error("Failed to save theme to localStorage:", e);
    }
  }, [resolvedTheme, theme]);

  return { theme, resolvedTheme };
}
