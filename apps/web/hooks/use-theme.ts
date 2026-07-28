"use client";

import { useTheme as useNextTheme } from "next-themes";

export function useTheme() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useNextTheme();

  return {
    theme: (theme as "dark" | "light" | "system") || "dark",
    setTheme: (mode: "dark" | "light" | "system") => setTheme(mode),
    isDark: resolvedTheme === "dark",
    systemTheme,
  };
}

export default useTheme;
