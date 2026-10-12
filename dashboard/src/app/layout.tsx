import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

// Manrope adalah variable font: satu file mencakup semua ketebalan (200–800).
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dashboard Evaluasi Layanan PDBK",
  description:
    "Visualisasi hasil survei instrumen evaluasi layanan PDBK (Guru, Kepala Sekolah, Orang Tua, Peserta Didik).",
};

// Inline init script: menerapkan tema tersimpan sebelum paint (hindari FOUC).
// Key localStorage harus sama dengan STORAGE_KEY di src/components/useTheme.ts.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('pdbk-theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'light';
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
    <html lang="id" suppressHydrationWarning className={`${manrope.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <a href="#main-content" className="skip-link">Langsung ke konten utama</a>
        {children}
      </body>
    </html>
  );
}
