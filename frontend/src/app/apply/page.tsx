import type { Metadata } from "next";
import { ApplyForm } from "@/components/apply/ApplyForm";
import { Page } from "@/components/layout/Page";
import { LineReveal } from "@/components/motion/LineReveal";
import { lines } from "@/lib/lines";

export const metadata: Metadata = {
  title: "Анкета участника",
  description:
    "Заполните анкету, чтобы принять участие в конкурсе премии «Знак мастерства».",
  alternates: { canonical: "/apply" },
};

export default function ApplyPage() {
  return (
    <Page tone="light">
      {/*
       * On desktop the form is set smaller than the landing pages, see
       * `compact` in globals.css. Its top keeps the mockup's 120 under the
       * header, scaled with the form.
       */}
      <section className="px-16 pb-24 pt-86 md:compact md:px-0 md:pb-92 md:pt-[calc(var(--header-h)+var(--u)*120)]">
        <LineReveal
          as="h1"
          when="load"
          text="Расскажите о себе"
          className="mx-auto text-center t-h2 max-md:w-254 max-md:tracking-[0.01em] max-md:-mb-0.5 max-md:pt-0.5"
        />
        <p
          data-hero-copy
          className="[--i:1] mx-auto mt-16 text-center t-body md:mt-40"
        >
          {lines(
            "Заполните анкету, чтобы принять|участие^в премии «Знак\u00a0мастерства».",
          )}
        </p>

        <div className="mt-40 md:mx-auto md:mt-100 md:w-1255">
          <ApplyForm />
        </div>
      </section>
    </Page>
  );
}
