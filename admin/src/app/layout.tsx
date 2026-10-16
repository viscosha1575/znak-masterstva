import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Google Sans (SIL Open Font License), cut down to Latin and Cyrillic.
// One variable file covers every weight from regular to bold.
const sans = localFont({
  src: "./fonts/GoogleSans.woff2",
  weight: "400 700",
  variable: "--font-panel",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Админ-панель — Знак мастерства",
    template: "%s — Админ-панель",
  },
  // The panel is for staff only and must stay out of search results.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7fe" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1437" },
  ],
};

/**
 * Applies the theme picked earlier (components/panel/ThemeToggle.tsx) before
 * the first paint, so a dark panel never flashes white on load.
 */
const THEME_SCRIPT = `try{if(localStorage.getItem("znak-theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${sans.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
