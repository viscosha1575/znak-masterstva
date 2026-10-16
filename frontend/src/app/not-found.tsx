import type { Metadata } from "next";
import { Page } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Страница не найдена" };

export default function NotFound() {
  return (
    <Page>
      {/*
       * `main` starts behind the header (see <Page>), hence the extra room at
       * the top; the section fills the window down to the footer, so the
       * footer meets the bottom of the screen.
       */}
      <section className="flex min-h-[calc(100svh-var(--footer-h))] flex-col items-center justify-center gap-24 px-16 pb-50 pt-[calc(var(--header-h)+var(--u)*50)] text-center md:gap-60 md:px-120">
        <h1 className="t-h2">404</h1>
        <p className="text-pretty text-mute t-body md:w-830">
          Такой страницы нет — возможно, ссылка устарела. Вернитесь на главную,
          там всё о премии «Знак мастерства».
        </p>
        <Button href="/" className="max-md:w-full">
          На главную
        </Button>
      </section>
    </Page>
  );
}
