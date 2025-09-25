"use client";

import { ThemeProvider } from "next-themes";

/**
 * Global client-only providers.
 * We disable system theme to avoid hydration flicker and keep full control.
 */
export default function Providers({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      enableColorScheme={false}
    >
      {children}
    </ThemeProvider>
  );
}
