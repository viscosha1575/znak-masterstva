"use client";

import { useId, useState } from "react";
import chevron from "@/assets/svg/chevron.svg";
import chevronMobile from "@/assets/svg/m-chevron.svg";
import { Reveal } from "@/components/motion/Reveal";
import { LineReveal } from "@/components/motion/LineReveal";
import { Collapse } from "@/components/ui/Collapse";
import { FAQ, TERMS_URL, type Copy, type FaqAnswer } from "@/content/home";
import { cn } from "@/lib/cn";
import { lines } from "@/lib/lines";

/** The wording of the phone layout, as plain text: for keys, labels and measuring. */
function phone(copy: Copy) {
  return typeof copy === "string" ? copy : copy.mobile;
}

function Answer({ answer }: { answer: FaqAnswer }) {
  if (typeof answer === "string" || "mobile" in answer) {
    return <p>{lines(answer)}</p>;
  }

  if (Array.isArray(answer)) {
    return (
      <div className="flex flex-col gap-10 md:gap-9 md:pb-1">
        {answer.map((paragraph) => (
          <p key={phone(paragraph)}>{lines(paragraph)}</p>
        ))}
      </div>
    );
  }

  if ("list" in answer) {
    return (
      // The bullets are the mockup's own small dots, not the browser's: those
      // come out nearly twice the size.
      <ul className="flex list-none flex-col gap-5 pl-24 md:gap-15 md:pl-52.5">
        {answer.list.map((item) => (
          <li
            key={phone(item)}
            className="relative before:absolute before:-left-14 before:top-8 before:size-3 before:rounded-full before:bg-current md:before:-left-30 md:before:top-19 md:before:size-6.5"
          >
            {lines(item)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p>
      {lines(answer.text)}
      {TERMS_URL ? (
        <a
          href={TERMS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-from-font underline-offset-[0.12em] transition-colors hover:text-white"
        >
          {answer.link}
        </a>
      ) : (
        answer.link
      )}
      {answer.end}
    </p>
  );
}

function Item({
  question,
  answer,
  open,
  onToggle,
}: {
  question: Copy;
  answer: FaqAnswer;
  open: boolean;
  onToggle: () => void;
}) {
  const id = useId();

  return (
    <li data-reveal-item="">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className={cn(
            "group flex w-full cursor-pointer items-center gap-12 text-left t-q",
            // As in the mobile mockup: a one-line question sits in a 15px row.
            !/[\n|]/.test(phone(question)) && "max-md:h-15",
          )}
        >
          {/*
           * Line breaks are set by hand (see FaqItem), so this box is only as
           * wide as its longest line and the chevron sits right next to the
           * question, centred on it — also when it runs to two lines.
           *
           * The chevron's box is a flex container, not a grid: the artwork is
           * taller than the box until rotated, and a grid track would grow to
           * fit it and push it off-centre.
           */}
          <span className="whitespace-nowrap transition-colors duration-300 group-hover:text-lilac">
            {lines(question)}
          </span>
          <span className="flex h-10 w-14 shrink-0 items-center justify-center md:h-40 md:w-56">
            <picture
              className={cn(
                "flex-none transition-[rotate] duration-500 ease-out-expo",
                open ? "-rotate-90" : "rotate-90",
              )}
            >
              <source media="(width >= 48rem)" srcSet={chevron.src} />
              <img
                src={chevronMobile.src}
                alt=""
                className="h-auto w-10 max-w-none md:w-40"
              />
            </picture>
          </span>
        </button>
      </h3>

      <Collapse
        open={open}
        id={id}
        role="region"
        aria-label={phone(question).replace(/[\n|^]/g, " ")}
      >
        <div className="pt-8 text-mute t-body md:pt-36">
          <Answer answer={answer} />
        </div>
      </Collapse>
    </li>
  );
}

export function Faq() {
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set());

  const toggle = (index: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(index)) next.add(index);
      return next;
    });

  return (
    <section
      aria-labelledby="faq-title"
      className="relative z-10 mt-50 px-16 pb-24 md:ml-399 md:mt-160 md:w-1121 md:px-0 md:pb-90"
    >
      <LineReveal
        id="faq-title"
        className="t-h2 max-md:-mb-0.5 max-md:pt-0.5"
        text={"Часто\nзадаваемые\nвопросы"}
      />

      <Reveal
        as="ul"
        group
        stagger={0.05}
        y={32}
        className="mt-24 flex flex-col gap-16 md:mt-70 md:gap-56"
      >
        {FAQ.map((item, index) => (
          <Item
            key={phone(item.question)}
            question={item.question}
            answer={item.answer}
            open={open.has(index)}
            onToggle={() => toggle(index)}
          />
        ))}
      </Reveal>
    </section>
  );
}
