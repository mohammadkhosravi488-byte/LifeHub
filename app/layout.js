import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "LifeHub",
  description: "Your Perfect Organiser.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
