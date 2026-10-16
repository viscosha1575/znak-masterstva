import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { PRIVACY_URL } from "@/content/home";

export function Footer() {
  return (
    // A sheet with rounded top corners that lies over the end of the page
    // (see the bottom padding in <Page>).
    <footer className="relative z-10 -mt-30 rounded-t-[calc(var(--u)*30)] bg-white md:-mt-50 md:rounded-t-[calc(var(--u)*50)]">
      <div className="relative mx-auto flex h-(--footer-h) max-w-(--frame) flex-col items-center pt-23 md:block md:pt-0">
        <Link
          href="/"
          aria-label="Авито Услуги — на главную"
          className="md:absolute md:right-120 md:top-77"
        >
          <Logo />
        </Link>
        {/*
         * The privacy policy is not in the mockups. The client's wording
         * runs it on from the copyright as one more sentence; a phone has no
         * room for that on one line, so there it takes the next.
         */}
        <p className="mt-11 text-center text-[#6b7280] t-foot md:absolute md:left-119 md:top-88 md:mt-0 md:text-left md:text-mute">
          {/* The phone mockup sets the line two pixels right of centre. */}
          <span className="max-md:inline-block max-md:translate-x-2">
            © Авито Услуги Премия 2026. Все права защищены.
          </span>{" "}
          <a
            href={PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 transition-colors hover:text-ink hover:underline max-md:mt-4 max-md:block"
          >
            Политика конфиденциальности
          </a>
        </p>
      </div>
    </footer>
  );
}
