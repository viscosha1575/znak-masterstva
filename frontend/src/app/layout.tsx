import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Tracker } from "@/components/analytics/Tracker";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ScrollMemory } from "@/components/layout/ScrollMemory";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { GlassFilter } from "@/components/ui/GlassFilter";
import { SCROLL_KEY } from "@/lib/scroll";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// CoFo Avito Display, the brand typeface from the mockups — the three weights
// the design uses. Self-hosted: no request leaves the site for fonts.
const brand = localFont({
  src: [
    { path: "./fonts/CoFoAvitoDisplay-Regular.woff2", weight: "400" },
    { path: "./fonts/CoFoAvitoDisplay-Medium.woff2", weight: "500" },
    { path: "./fonts/CoFoAvitoDisplay-Bold.woff2", weight: "700" },
  ],
  variable: "--font-brand",
  display: "swap",
});

// The Light weight is used for one thing only — the large figures on the
// rating page — so its file holds the ten digits and nothing else.
const figures = localFont({
  src: "./fonts/CoFoAvitoDisplay-Light-digits.woff2",
  weight: "300",
  variable: "--font-figures",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0030-0039" }],
});

/*
 * A shared link shows the first screen of the home page in its preview:
 * opengraph-image.jpg next to this file (1200 × 630, a capture of the site
 * with the small copy left out), on every page. Its title and description are
 * the page's own: Next fills og:title and og:description from them.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Знак мастерства — премия Авито Услуг",
    template: "%s — Знак мастерства",
  },
  description:
    "«Знак мастерства» — первая ежегодная премия Авито Услуг, которая объединяет профессионалов из разных сфер услуг по всей России и отмечает тех, кто делает своё дело на совесть.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Знак мастерства — премия Авито Услуг",
  },
  twitter: { card: "summary_large_image" },
  // Proof to Yandex Webmaster and Google Search Console that the site is ours.
  // Keep them: the services check again from time to time.
  verification: {
    yandex: "8b5dcefbb8be21cc",
    google: "ox4mqNFTuz-Rz6ZyU5_gLwoZHzLoUVLuKSI56ZF7dRo",
  },
};

export const viewport: Viewport = {
  themeColor: "#15071e",
};

/**
 * Runs before first paint.
 *
 * Publishes the scrollbar-free viewport width as `--vw`: the whole layout
 * scales from it (see `--u` in globals.css), and plain `100vw` would overshoot
 * by the scrollbar width on Windows and Linux.
 *
 * And marks a weak device with `data-lite`, so that it never even starts the
 * effects a slow graphics chip pays most for — glass blur and refraction, the
 * drift of the large glows (globals.css). "Weak" is what the browser admits
 * to: data saving switched on, 2 GB of memory or less, or up to 4 GB (which
 * is also how 6 GB reports itself) on a phone or with four cores at most.
 * Browsers that do not tell (Safari, Firefox) are judged by two cores or
 * fewer here and by their frame rate later, see <FrameWatch>.
 */
const BOOT_SCRIPT = `(function(){var d=document.documentElement,n=navigator,m=n.deviceMemory,c=n.hardwareConcurrency||8,k=n.connection;function s(){d.style.setProperty('--vw',d.clientWidth+'px')}s();new ResizeObserver(s).observe(d);if((k&&k.saveData)||(m?m<=2||(m<=4&&(c<=4||matchMedia('(pointer:coarse)').matches)):c<=2))d.setAttribute('data-lite','')})()`;

/**
 * Runs as soon as `#page` is parsed, before the first paint.
 *
 * On a touch screen the page scrolls inside `#page` (see lib/scroll.ts), and
 * the browser does not put a scrolled box back on a reload as it does a
 * scrolled document. So this does, from the position <ScrollMemory> kept.
 * Should the page still be too short for it (fonts not in yet), it tries
 * again once they and the pictures are, unless the visitor has touched the
 * page by then.
 */
const RESTORE_SCRIPT = `(function(){try{var p=document.getElementById('page'),n=performance.getEntriesByType('navigation')[0];if(!p||!n||(n.type!=='reload'&&n.type!=='back_forward')||getComputedStyle(p).overflowY==='visible')return;var y=+sessionStorage.getItem(${JSON.stringify(SCROLL_KEY)}+location.pathname);if(!(y>0))return;p.scrollTop=y;if(p.scrollTop>=y-1)return;var t=0,f=function(){if(!t)p.scrollTop=y};p.addEventListener('touchstart',function(){t=1},{once:true,passive:true});document.fonts.ready.then(f);addEventListener('load',f,{once:true})}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${brand.variable} ${figures.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>
        <GlassFilter />
        <Tracker />
        <SmoothScroll />
        {/* The page's scroller on touch screens, a plain box elsewhere (lib/scroll.ts). */}
        <div id="page">
          <Header />
          {children}
          <Footer />
        </div>
        <script dangerouslySetInnerHTML={{ __html: RESTORE_SCRIPT }} />
        <ScrollMemory />
      </body>
    </html>
  );
}
