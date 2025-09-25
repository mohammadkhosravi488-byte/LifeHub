"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const current = theme ?? resolvedTheme;
  const isDark = current === "dark";

  return (
    <button
      type="button"
      aria-pressed={isDark}
      aria-label="Toggle dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-8 px-3 rounded-md border border-gray-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800"
    >
      {isDark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
