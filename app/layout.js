// app/layout.js
import "./globals.css";
import Providers from "@/components/Providers"; // <- client provider
import DarkModeToggle from "@/components/DarkModeToggle";
import { LifehubDataProvider, useLifehubData } from "@/lib/data-context";

export const metadata = {
  title: "LifeHub",
  description: "Your all-in-one hub",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LifehubDataProvider>
          {children}
        </LifehubDataProvider>
      </body>
    </html>
  );
}