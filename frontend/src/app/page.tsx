import type { Metadata } from "next";
import { Faq } from "@/components/home/Faq";
import { Hero } from "@/components/home/Hero";
import { Prizes } from "@/components/home/Prizes";
import { RatingBadge } from "@/components/home/RatingBadge";
import { Stages } from "@/components/home/Stages";
import { Streak } from "@/components/home/Streak";
import { Tracks } from "@/components/home/Tracks";
import { Page } from "@/components/layout/Page";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <Page>
      <Streak
        frame="-left-263 top-2984 h-1402.25 w-1058 md:-left-453.5 md:top-4707.5 md:h-4304.75 md:w-3857.5"
        spin="-scale-y-100 rotate-[119.35deg] md:rotate-[128.74deg]"
        box="h-451.75 w-1354.75 md:h-1452 md:w-4354"
        mask={{ left: 840.46, top: 317.5, right: 2373.46, bottom: 3006.42 }}
      />

      <Hero />
      <Tracks />
      <RatingBadge />
      <Prizes />
      <Stages />
      <Faq />
    </Page>
  );
}
