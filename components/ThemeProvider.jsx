"use client";
import { useEffect, useState } from "react";
import { LifehubDataProvider } from "@/lib/data-context";
export default function ThemeProvider({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Only our class controls theme; ignore system preference
    const stored = localStorage.getItem("lh_theme") || "light";
    document.documentElement.classList.toggle("dark", stored === "dark");
    document.documentElement.setAttribute("data-theme", stored);
    setReady(true);
  }, []);

  if (!ready) return null; // avoid flash

  return children;
}
