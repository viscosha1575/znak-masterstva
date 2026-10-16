"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import pageGlowPhone from "@/assets/images/glow/m-account-gradient.webp";
import pageGlow from "@/assets/images/glow/page-glow.webp";
import glowA from "@/assets/svg/account-glow-a.svg";
import glowB from "@/assets/svg/account-glow-b.svg";
import edit from "@/assets/svg/edit.svg";
import glowPhone from "@/assets/svg/m-account-glow.svg";
import { Streak } from "@/components/home/Streak";
import { Reveal } from "@/components/motion/Reveal";
import { Tilt } from "@/components/motion/Tilt";
import { Arc } from "@/components/ui/Arc";
import { Blob } from "@/components/ui/Blob";
import { Button } from "@/components/ui/Button";
import { Disc } from "@/components/ui/Disc";
import { QueryParam } from "@/components/ui/QueryParam";
import { NOMINATIONS } from "@/content/nominations";
import {
  createPassword,
  MAX_APPLICATIONS,
  MIN_PASSWORD,
  signIn,
  useApplicationStore,
  type Application,
} from "@/lib/applications";
import { cn } from "@/lib/cn";
import { lines, type PerLayout } from "@/lib/lines";

/** Support contact shown when an application is rejected. The live site uses the client's address. */
const SUPPORT_EMAIL = "support@example.com";

/**
 * `/account?demo=0|1|2|3` previews the states from the mockups without
 * signing in or submitting anything: the sign-in form, one application, two
 * applications, a rejected one. `demo=4` is the screen the mockups do not
 * have: setting a password for applications sent before accounts existed.
 */
const DEMO: Record<string, Application[] | "signed-out" | "no-password"> = {
  "0": "signed-out",
  "1": [demo("stories", "moderation")],
  "2": [demo("stories", "moderation"), demo("stable", "moderation")],
  "3": [demo("stories", "rejected")],
  "4": "no-password",
};

function demo(nomination: string, status: Application["status"]): Application {
  return {
    id: `demo-${nomination}`,
    name: "Иван Иванов",
    email: "",
    phone: "",
    avitoId: "",
    city: "",
    kind: "",
    field: "",
    nomination,
    story: "",
    photos: [],
    consentPromo: false,
    status,
    createdAt: "",
  };
}

function copyFor(applications: Application[]): {
  title: string;
  text: string | PerLayout;
  rejected?: boolean;
} {
  if (applications.length === 0) {
    return {
      title: "У вас пока нет заявок",
      text: "Подайте заявку на конкурс — она появится здесь, и вы сможете следить за её статусом.",
    };
  }
  if (applications.some((item) => item.status === "rejected")) {
    return {
      title: "Ваша з{а}явка\nоткл{о}нена",
      text: {
        mobile:
          "Заявка не прошла модерацию. Отправили вам письмо с причиной отказа и рекомендациями,\nкак её доработать.",
        desktop:
          "Заявка не прошла модерацию. Отправили вам письмо\nс причиной отказа и рекомендациями,\nкак её доработать.",
      },
      rejected: true,
    };
  }
  // Not in the mockups, which stop at moderation: worded after the two states they do show.
  if (applications.every((item) => item.status === "approved")) {
    return applications.length > 1
      ? {
          title: "Ваши з{а}явки\nприняты",
          text: "Заявки прошли модерацию|и участвуют в конкурсе.",
        }
      : {
          title: "Ваша з{а}явка\nпринята",
          text: "Заявка прошла модерацию|и участвует в конкурсе.",
        };
  }
  return applications.length > 1
    ? {
        title: "Ваши з{а}явки\nна м{о}дерации",
        text: "Отправили ваши заявки|на проверку.^Мы сообщим,|когда модерация завершится.",
      }
    : {
        title: "Ваша з{а}явка\nна м{о}дерации",
        text: "Отправили вашу заявку|на проверку.^Мы сообщим,|когда модерация завершится.",
      };
}

/**
 * The ornaments behind the page. On a phone they sit in the bottom corner,
 * measured from the footer; the desktop mockups measure them from the top and
 * move them down as the page fills up.
 */
/**
 * Where the desktop mockups mask the streak off, screen by screen: a little
 * below the header and short of the left side, a little differently on each.
 */
const STREAK_MASK = {
  signIn: { left: 1294.22, top: 1999.01, right: 2439.22 },
  one: { left: 1101.22, top: 1995.01, right: 2439.22 },
  two: { left: 1019.22, top: 2001.01, right: 2439.22 },
  rejected: { left: 1196.22, top: 2040.01, right: 2439.22 },
};

function Ornaments({
  cards,
  screen = "signIn",
}: {
  cards: number;
  screen?: keyof typeof STREAK_MASK;
}) {
  const drop = cards > 1 ? 2 : cards;
  const glowTop = ["md:top-432", "md:top-799", "md:top-849"][drop];
  const arcTop = ["md:top-564", "md:top-901", "md:top-1121"][drop];
  const discTop = ["md:top-708", "md:top-1045", "md:top-1265"][drop];

  return (
    <>
      <Streak
        frame="-left-80 -top-159 h-823.75 w-806.25 md:-left-519.25 md:-top-1803 md:h-4324.75 md:w-4590.25"
        spin="-scale-y-100 rotate-[133.77deg] md:rotate-[138.41deg]"
        box="h-288.25 w-864.5 md:h-1579.25 md:w-4735.75"
        mask={STREAK_MASK[screen]}
        eager
      />
      <Blob
        src={pageGlowPhone}
        frame="-left-530 -bottom-518 h-733 w-753.5 md:hidden"
        spin="rotate-[14.6deg]"
        box="h-595 w-623.5"
        bleed="inset-[-13.08%_-12.48%]"
      />
      <Blob
        src={pageGlow}
        frame={cn("-left-1767 h-2277.75 w-2349 max-md:hidden", glowTop)}
        spin="rotate-[11.75deg]"
        box="h-1910.25 w-2002"
        bleed="inset-[-5.24%_-5%_-5.24%_-7.33%]"
      />
      {/* Desktop: a disc peeks out from behind the first card. */}
      {cards > 0 && (
        <Disc
          frame={cn(
            "left-221.5 size-512.5 max-md:hidden",
            cards > 1 ? "top-675.75" : "top-645.75",
          )}
          spin="-scale-y-100 rotate-[-146.42deg]"
          box="size-369.75"
        />
      )}
      <Disc
        frame={cn(
          "left-155.5 -bottom-185 size-360 md:bottom-auto md:left-1429.75 md:size-780.5",
          discTop,
        )}
        spin="-scale-y-100 rotate-135 md:rotate-[152.78deg]"
        box="size-254.75 md:size-579.5"
        fade="desktop"
        sizes="(width < 48rem) 71vw, 31vw"
      />
      <Arc
        frame={cn(
          "left-151.75 -bottom-20.5 h-242.25 w-237.25 md:bottom-auto md:left-1432.75 md:h-549.75 md:w-550.75",
          arcTop,
        )}
        spin="rotate-[-142.55deg] md:rotate-[-134.36deg]"
        box="h-184.75 w-157.25 md:h-420.5 md:w-357.75"
        dark
      />
    </>
  );
}

function ApplicationCard({ application }: { application: Application }) {
  const nomination =
    NOMINATIONS.find((item) => item.id === application.nomination)?.title ??
    application.nomination;
  const editable = !application.id.startsWith("demo-");

  return (
    <Tilt
      as="article"
      data-reveal-item=""
      className="glass h-145 w-full overflow-clip rounded-card bg-night/5 text-left [--glass-blur:1.66] md:h-418 md:w-830 md:bg-violet/5 md:[--glass-blur:11.6]"
    >
      <Blob
        src={glowPhone}
        frame="left-223 top-39.5 h-187.75 w-194.25 md:hidden"
        spin="-scale-y-100 rotate-180"
        box="h-187.75 w-194.25"
        bleed="inset-[-29.64%_-27.27%_-11.91%_-14.07%]"
      />
      <Blob
        src={glowA}
        frame="left-566.5 top-346.25 h-481 w-497 max-md:hidden"
        spin="-scale-y-100 rotate-180"
        box="h-481 w-497"
        bleed="inset-[-43.53%_-40.68%_-25.8%_-27.48%]"
      />
      <Blob
        src={glowB}
        frame="left-550 top-150 h-477 w-494 max-md:hidden"
        spin="-scale-y-100 rotate-180"
        box="h-477 w-494"
        bleed="inset-[-43.56%_-40.71%_-25.83%_-27.51%]"
      />

      <h2 className="absolute left-20 top-20 max-w-250 truncate t-h3 md:left-50 md:top-50 md:max-w-650">
        {application.name}
      </h2>
      <dl className="absolute left-20 top-85 md:left-50 md:top-262">
        <dt className="text-mute t-note max-md:opacity-80">Номинация</dt>
        <dd className="mt-8 max-md:opacity-80 max-md:t-body md:mt-20 md:t-q">
          {nomination}
        </dd>
      </dl>

      {editable && (
        <Link
          href={`/apply?edit=${application.id}`}
          aria-label={`Редактировать заявку в номинации «${nomination}»`}
          className="absolute right-20 top-26 block size-20 transition-transform duration-300 ease-out-expo hover:scale-115 hover:-rotate-8 md:right-50 md:top-50 md:size-50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={edit.src} alt="" className="size-full" />
        </Link>
      )}
      {!editable && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={edit.src}
          alt=""
          className="absolute right-20 top-26 size-20 md:right-50 md:top-50 md:size-50"
        />
      )}
    </Tilt>
  );
}

const field =
  "size-full rounded-[inherit] bg-transparent px-10 text-white t-body outline-none placeholder:text-mute focus-visible:shadow-[inset_0_0_0_2px_var(--color-lilac)] md:px-34";

/** Signing in to the account opened with an earlier application. */
function SignIn({ preview }: { preview: boolean }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (preview || busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setProblem(null);
    try {
      await signIn(String(data.get("login")), String(data.get("password")));
    } catch (error) {
      setProblem(
        error instanceof Error ? error.message : "Не получилось войти",
      );
      setBusy(false);
    }
  };

  return (
    <Reveal
      group
      stagger={0.12}
      y={40}
      className="relative flex flex-col items-center text-center md:pb-109 md:pt-60"
    >
      <h1
        data-reveal-item=""
        className="t-h2 max-md:tracking-[0.01em] max-md:-mb-0.5 max-md:pt-0.5"
      >
        {lines("Вх{о}д")}
      </h1>
      <form
        data-reveal-item=""
        onSubmit={onSubmit}
        className="mt-40 flex w-full flex-col items-center md:mt-120 md:w-888"
      >
        <div className="flex w-full flex-col gap-12 md:gap-20">
          <label className="glass glass-mirrored block h-35 rounded-(--pane-r) bg-night/5 [--glass-blur:1.66] [--pane-r:calc(var(--u)*12)] md:h-90 md:[--glass-blur:3.8] md:[--pane-r:calc(var(--u)*30)]">
            <span className="sr-only">Телефон или почта</span>
            <input
              name="login"
              required
              autoComplete="username"
              autoCapitalize="none"
              placeholder="Телефон или почта"
              className={field}
            />
          </label>
          <label className="glass glass-mirrored block h-35 rounded-(--pane-r) bg-night/5 [--glass-blur:1.66] [--pane-r:calc(var(--u)*12)] md:h-90 md:[--glass-blur:3.8] md:[--pane-r:calc(var(--u)*30)]">
            <span className="sr-only">Пароль</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Пароль"
              className={field}
            />
          </label>
        </div>
        {problem && (
          <p role="alert" className="mt-8 text-danger t-small md:mt-20">
            {problem}
          </p>
        )}
        <Button
          type="submit"
          disabled={busy}
          className="mt-24 disabled:cursor-progress disabled:opacity-70 max-md:w-full md:mt-70"
        >
          {busy ? "Входим…" : "Войти"}
        </Button>
      </form>
    </Reveal>
  );
}

/**
 * An applicant from before accounts existed: their browser is known, their
 * applications are there, but nothing is shown without a password — so they
 * set one. The mockups have no such screen; it follows the sign-in one.
 */
function SetPassword({
  preview,
  onSignIn,
}: {
  preview: boolean;
  onSignIn: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (preview || busy) return;
    const password = String(new FormData(event.currentTarget).get("password"));
    if (password.length < MIN_PASSWORD) {
      setProblem(`Придумайте пароль — не короче ${MIN_PASSWORD} символов`);
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      await createPassword(password);
    } catch (error) {
      setProblem(
        error instanceof Error ? error.message : "Не получилось сохранить",
      );
      setBusy(false);
    }
  };

  return (
    <Reveal
      group
      stagger={0.12}
      y={40}
      className="relative flex flex-col items-center text-center md:pb-109 md:pt-60"
    >
      <h1
        data-reveal-item=""
        className="t-h2 max-md:-mb-0.5 max-md:pt-0.5 max-md:tracking-[0.01em]"
      >
        {lines("Придумайте\nпар{о}ль")}
      </h1>
      <p data-reveal-item="" className="mt-16 t-body max-md:w-289 md:mt-40">
        {lines({
          mobile:
            "Ваша заявка сохранена.\nЧтобы открыть личный кабинет,\nпридумайте пароль — с ним вы\nсможете входить по телефону\nили почте из заявки",
          desktop:
            "Ваша заявка сохранена. Чтобы открыть личный кабинет,\nпридумайте пароль — с ним вы сможете входить по телефону\nили почте из заявки",
        })}
      </p>
      <form
        data-reveal-item=""
        onSubmit={onSubmit}
        className="mt-24 flex w-full flex-col items-center md:mt-70 md:w-888"
      >
        <label className="glass glass-mirrored block h-35 w-full rounded-(--pane-r) bg-night/5 [--glass-blur:1.66] [--pane-r:calc(var(--u)*12)] md:h-90 md:[--glass-blur:3.8] md:[--pane-r:calc(var(--u)*30)]">
          <span className="sr-only">Пароль</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder={`Пароль — не короче ${MIN_PASSWORD} символов`}
            className={field}
          />
        </label>
        {problem && (
          <p role="alert" className="mt-8 text-danger t-small md:mt-20">
            {problem}
          </p>
        )}
        <Button
          type="submit"
          disabled={busy}
          className="mt-24 disabled:cursor-progress disabled:opacity-70 max-md:w-full md:mt-70"
        >
          {busy ? "Сохраняем…" : "Сохранить"}
        </Button>
      </form>
      <p data-reveal-item="" className="mt-16 text-mute t-small md:mt-40">
        Уже придумали пароль?{" "}
        <button
          type="button"
          onClick={onSignIn}
          className="cursor-pointer underline decoration-from-font underline-offset-[0.12em] transition-colors hover:text-white"
        >
          Войти
        </button>
      </p>
    </Reveal>
  );
}

export function AccountView() {
  const {
    applications: stored,
    account,
    passwordNeeded,
    failed,
  } = useApplicationStore();
  // An applicant asked to set a password may have one already, from another browser.
  const [signingIn, setSigningIn] = useState(false);
  // `null` until the query string has been read on the client.
  const [demo, setDemo] = useState<{ id?: string } | null>(null);
  const onDemo = useCallback((id?: string) => setDemo({ id }), []);
  const demoParam = <QueryParam name="demo" onChange={onDemo} />;

  const preview = demo?.id ? DEMO[demo.id] : undefined;

  // Nothing to show until both the server's answer and the query string are known.
  if (!demo || (!preview && !stored)) {
    return (
      <>
        {demoParam}
        <Ornaments cards={0} />
        <div className="relative flex min-h-[60svh] items-center justify-center text-center">
          {failed && demo && (
            <p role="alert" className="text-pretty t-body md:w-900">
              Не получилось загрузить ваши заявки. Обновите страницу или зайдите
              чуть позже.
            </p>
          )}
        </div>
      </>
    );
  }

  // A browser that sent applications before accounts existed: no password, no cabinet.
  const unopened = !preview && passwordNeeded && !account;
  if ((unopened || preview === "no-password") && !signingIn) {
    return (
      <>
        {demoParam}
        <Ornaments cards={0} />
        <SetPassword
          preview={preview === "no-password"}
          onSignIn={() => setSigningIn(true)}
        />
      </>
    );
  }

  const signedOut = preview === "signed-out" || preview === "no-password";
  const applications = signedOut ? [] : (preview ?? stored ?? []);
  // A browser the server does not know: no applications and no account.
  if (signedOut || (applications.length === 0 && !account)) {
    return (
      <>
        {demoParam}
        <Ornaments cards={0} />
        <SignIn preview={signedOut} />
      </>
    );
  }

  const copy = copyFor(applications);
  const empty = applications.length === 0;
  const canAddMore = applications.length < MAX_APPLICATIONS;
  const single = applications.length === 1;

  return (
    <>
      {demoParam}
      <Ornaments
        cards={applications.length}
        screen={
          empty
            ? "signIn"
            : copy.rejected
              ? "rejected"
              : single
                ? "one"
                : "two"
        }
      />
      {/* Keyed by its contents: the entrance animation is set up once per mount. */}
      <Reveal
        key={applications.map((item) => item.id + item.status).join("|")}
        group
        stagger={0.12}
        y={40}
        className={cn(
          "relative flex flex-col items-center text-center",
          // The mockup of a single application on moderation has more room under the button.
          single && !copy.rejected && "md:pb-65",
        )}
      >
        <h1
          data-reveal-item=""
          className="t-h2 max-md:w-327 max-md:tracking-[0.01em] max-md:-mb-0.5 max-md:pt-0.5"
        >
          {lines(copy.title)}
        </h1>
        <p
          data-reveal-item=""
          className={cn(
            "mt-16 t-body md:mt-40",
            empty && "md:w-900",
            copy.rejected ? "max-md:w-289" : "max-md:w-265",
          )}
        >
          {lines(copy.text)}
        </p>

        {copy.rejected && (
          <p data-reveal-item="" className="mt-12 text-mute t-small md:mt-40">
            Служба поддержки{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="transition-colors hover:text-white"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
        )}

        {!empty && (
          <div
            className={cn(
              "relative mt-50 flex w-full flex-col items-center gap-16 md:gap-49",
              copy.rejected ? "md:mt-141" : single ? "md:mt-120" : "md:mt-115",
            )}
          >
            {/* Phone: a disc peeks out from behind the first card. */}
            <Disc
              frame="-left-72 -top-44 size-166.25 md:hidden"
              spin="-scale-y-100 rotate-[-85.53deg]"
              box="size-154.75"
            />
            {applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}

        {(empty || canAddMore) && (
          <div
            data-reveal-item=""
            className={cn(
              "w-full md:w-auto",
              empty ? "mt-30 md:mt-70" : "mt-24 md:mt-70",
            )}
          >
            <Button
              href="/apply"
              variant={empty ? "primary" : "outline"}
              className={cn("max-md:w-full", !empty && "md:px-180 md:py-27!")}
            >
              {empty ? "Подать заявку" : "Хочу отправить еще"}
            </Button>
          </div>
        )}
      </Reveal>
    </>
  );
}
