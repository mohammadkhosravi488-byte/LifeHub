"use client";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    const stored = localStorage.getItem("lh_theme") || "light";
    setMode(stored);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem("lh_theme", mode);
  }, [mode]);

  return (
    <button
      onClick={() => setMode((m) => (m === "light" ? "dark" : "light"))}
      className="h-8 px-3 rounded-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
      title="Toggle dark mode"
    >
      {mode === "dark" ? "Light" : "Dark"}
    </button>
  );
}
