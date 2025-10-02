"use client";
import { useEffect, useState } from "react";
import { LifehubDataProvider } from "@/lib/data-context";
export default function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-neutral-800"
    >
      {dark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
