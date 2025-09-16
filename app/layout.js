// app/layout.js
import "./globals.css";

export const metadata = {
  title: "LifeHub",
  description: "Your all-in-one hub",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var stored = localStorage.getItem('lh_theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var initial = stored || (prefersDark ? 'dark' : 'light');
    var root = document.documentElement;
    root.classList.remove('dark','light');
    root.classList.add(initial);
  } catch(e){}
})();
          `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
