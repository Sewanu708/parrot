"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { TransitionIcon } from "@/components/icons";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="w-9 h-9 rounded-md cursor-pointer flex items-center justify-center text-[#37352f]/40 dark:text-[#777777] border border-transparent transition-colors"
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </button>
    );
  }
  

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 rounded-md flex items-center justify-center text-[#37352f]/60 dark:text-[#9b9b9b] hover:text-[#37352f] dark:hover:text-[#ffffff] cursor-pointer hover:bg-[#f7f7f5] dark:hover:bg-[#252525] border border-transparent transition-colors"
      aria-label="Toggle theme"
    >
      <TransitionIcon className="w-5 h-5" isDark={isDark} />
    </button>
  );
}
