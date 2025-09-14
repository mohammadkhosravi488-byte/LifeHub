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
    <div className="flex items-center gap-2">
      <button
        aria-label="Light"
        className={`h-8 px-3 rounded-md border text-sm ${
          !isDark ? "bg-white border-gray-300" : "bg-transparent border-gray-300"
        }`}
        onClick={() => setTheme("light")}
      >
        Light
      </button>
      <button
        aria-label="Dark"
        className={`h-8 px-3 rounded-md border text-sm ${
          isDark ? "bg-white border-gray-300" : "bg-transparent border-gray-300"
        }`}
        onClick={() => setTheme("dark")}
      >
        Dark
      </button>
      <button
        aria-label="System"
        className="h-8 px-3 rounded-md border border-gray-300 text-sm"
        onClick={() => setTheme("system")}
      >
        System
      </button>
    </div>
  );
}
