import type { Metadata } from "next";
import { AccountView } from "@/components/account/AccountView";
import { Page } from "@/components/layout/Page";

export const metadata: Metadata = {
  title: "Личный кабинет",
  description: "Статус ваших заявок на конкурс премии «Знак мастерства».",
  // Each visitor's own page: nothing in it for a search engine.
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <Page>
      {/* The page fills the screen exactly: `main` starts behind the header and the footer overlaps its end. */}
      <section className="relative z-10 min-h-[calc(100svh-var(--footer-h))] px-16 pb-50 pt-86 md:px-120 md:pb-90 md:pt-232">
        <AccountView />
      </section>
    </Page>
  );
}
