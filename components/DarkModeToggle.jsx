// components/DarkModeToggle.jsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

export default function DarkModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch while next-themes syncs with the DOM
  useEffect(() => setMounted(true), []);
  const isDark = useMemo(() => resolvedTheme === "dark", [resolvedTheme]);

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="px-3 py-1 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold transition-colors"
      aria-pressed={isDark}
    >
      {isDark ? "🌞 Light Mode" : "🌙 Dark Mode"}
    </button>
  );
}
