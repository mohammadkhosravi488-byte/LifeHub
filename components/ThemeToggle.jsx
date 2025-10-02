"use client";
import { LifehubDataProvider } from "@/lib/data-context";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // initial
    const saved = localStorage.getItem("lh-theme");
    const isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("lh-theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="h-8 px-3 rounded-lg border bg-white text-sm border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
      title="Toggle dark mode"
      aria-pressed={dark}
    >
      {dark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
