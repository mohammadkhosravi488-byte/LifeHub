// app/layout.js
import "./globals.css";
import Providers from "@/components/Providers";
import DarkModeToggle from "@/components/DarkModeToggle";

export const metadata = {
  title: "LifeHub",
  description: "Your all-in-one hub",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white text-gray-900 dark:bg-neutral-950 dark:text-gray-100">
        <Providers>
          {/* Top bar with theme toggle (single source of truth) */}
          <div className="sticky top-0 z-40 border-b border-gray-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur">
            <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
              <div className="text-sm font-semibold">LifeHub</div>
              <DarkModeToggle />
            </div>
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
