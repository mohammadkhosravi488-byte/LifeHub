"use client";

import { ThemeProvider } from "next-themes";
import { LifehubDataProvider } from "@/lib/data-context";

/**
 * Global client-only providers.
 * We lean on next-themes to manage a `dark` class on the root element
 * so Tailwind's `dark:` variants and our CSS variables respond correctly.
 */
export default function Providers({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme={false}
      disableTransitionOnChange
      storageKey="lifehub-theme"
      themes={["light", "dark"]}
    >
      <LifehubDataProvider>{children}</LifehubDataProvider>
    </ThemeProvider>
  );
}
