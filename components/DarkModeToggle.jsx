"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function DarkModeToggle() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = mounted ? (theme === "system" ? systemTheme : theme) : "light";
  const isDark = current === "dark";

  if (!mounted) {
    // Avoid hydration mismatch
    return (
      <button
        aria-label="Toggle theme"
        className="h-8 px-3 rounded-md border border-gray-300 bg-white text-sm"
        disabled
      >
        Theme
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="h-8 px-3 rounded-full border border-gray-300 bg-white text-sm font-semibold"
      title={mode === "dark" ? "Switch to light" : "Switch to dark"}
      aria-label="Toggle dark mode"
    >
      {mode === "dark" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
