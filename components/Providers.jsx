"use client";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }) {
  return (
    <ThemeProvider
      attribute="class"     // adds/removes `class="dark"`
      defaultTheme="light"  // start in light unless user changed it
      enableSystem={false}  // disable OS/system theme
    >
      {children}
    </ThemeProvider>
  );
}
