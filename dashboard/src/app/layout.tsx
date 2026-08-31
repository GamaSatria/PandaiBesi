import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dashboard Evaluasi Layanan PDBK",
  description:
    "Visualisasi hasil survei instrumen evaluasi layanan PDBK (Guru, Kepala Sekolah, Orang Tua, Peserta Didik).",
};

// Inline init script: applies stored theme before paint to avoid FOUC.
// Must run before React hydrates, so it's safe and matches SSR html class.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('pdbk-theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    var root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
    root.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)] font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
