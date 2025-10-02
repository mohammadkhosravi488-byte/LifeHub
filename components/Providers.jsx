"use client";
import { ThemeProvider } from "next-themes";
import { LifehubDataProvider } from "@/lib/data-context";
export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}
