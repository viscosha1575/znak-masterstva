"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PhotoDrop } from "@/components/apply/PhotoDrop";
import { Select } from "@/components/apply/Select";
import { Button } from "@/components/ui/Button";
import { QueryParam } from "@/components/ui/QueryParam";
import { PRIVACY_URL, TERMS_URL } from "@/content/home";
import { NOMINATIONS, nominationNote } from "@/content/nominations";
import { track } from "@/lib/analytics";
import {
  MAX_APPLICATIONS,
  MIN_PASSWORD,
  photoUrl,
  refreshApplications,
  removePhoto,
  saveApplication,
  uploadPhoto,
  useApplicationStore,
  type Photo,
} from "@/lib/applications";
import { cn } from "@/lib/cn";
import { lines } from "@/lib/lines";

const KINDS = [
  { value: "private", label: "Частный исполнитель" },
  { value: "company", label: "Компания" },
];

const CONSENT_REQUIRED = "Без согласия мы не сможем принять заявку";

// The server checks the same rules again (admin/src/lib/validation.ts); keep the two in step.
const schema = z.object({
  name: z
    .string()
    .trim()
    .max(120, "Слишком длинное имя")
    .regex(/\S+\s+\S+/, "Укажите имя и фамилию"),
  email: z.email("Проверьте адрес почты").max(200, "Проверьте адрес почты"),
  phone: z
    .string()
    .refine(
      (value) => value.replace(/\D/g, "").length === 11,
      "Введите номер полностью",
    ),
  avitoId: z.string().regex(/^\d{9}$/, "Авито ID — это 9 цифр"),
  city: z.string().trim().min(2, "Укажите город").max(100, "Укажите город"),
  kind: z.string().min(1, "Выберите тип"),
  field: z
    .string()
    .trim()
    .min(2, "Укажите сферу деятельности")
    .max(150, "Укажите сферу деятельности короче"),
  nomination: z.string().min(1, "Выберите номинацию"),
  story: z
    .string()
    .trim()
    .min(40, "Расскажите чуть подробнее — хотя бы пару предложений")
    .max(10_000, "Рассказ слишком длинный — сократите до 10 000 знаков"),
  // All three consents are required.
  consentData: z.boolean().refine((value) => value, CONSENT_REQUIRED),
  consentTerms: z.boolean().refine((value) => value, CONSENT_REQUIRED),
  consentPromo: z.boolean().refine((value) => value, CONSENT_REQUIRED),
  // Asked for with the first application only — see `needsPassword` below.
  password: z.string(),
});

type Values = z.infer<typeof schema>;

const EMPTY: Values = {
  name: "",
  email: "",
  phone: "",
  avitoId: "",
  city: "",
  kind: "",
  field: "",
  nomination: "",
  story: "",
  consentData: false,
  consentTerms: false,
  consentPromo: false,
  password: "",
};

/** Formats digits as +7 926 123-45-67 while the user types. */
function formatPhone(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits === "") return "";
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (!digits.startsWith("7")) digits = `7${digits}`;
  digits = digits.slice(0, 11);

  const parts = [
    digits.slice(1, 4),
    digits.slice(4, 7),
    digits.slice(7, 9),
    digits.slice(9, 11),
  ];
  let result = "+7";
  if (parts[0]) result += ` ${parts[0]}`;
  if (parts[1]) result += ` ${parts[1]}`;
  if (parts[2]) result += `-${parts[2]}`;
  if (parts[3]) result += `-${parts[3]}`;
  return result;
}

const control =
  "w-full rounded-[calc(var(--u)*12)] bg-field text-ink t-input outline-none transition-shadow duration-300 placeholder:text-mute focus-visible:shadow-[inset_0_0_0_2px_var(--color-violet)] aria-invalid:shadow-[inset_0_0_0_1.5px_var(--color-danger)]";
const input = `${control} h-35 px-10 md:h-90 md:rounded-[calc(var(--u)*30)] md:px-34`;
const documentLink = "text-sky underline-offset-2 hover:underline";

function Field({
  label,
  htmlFor,
  labelId,
  hint,
  hintId,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  labelId?: string;
  /** A line under the control on how to fill it in; give the control `aria-describedby={hintId}`. */
  hint?: string;
  hintId?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8 md:gap-25">
      <label id={labelId} htmlFor={htmlFor} className="t-q">
        {label}
      </label>
      {children}
      {hint && (
        <p id={hintId} className="-mt-2 text-ink/60 t-small md:-mt-10">
          {hint}
        </p>
      )}
      {error && (
        <p role="alert" className="-mt-2 text-danger t-small md:-mt-10">
          {error}
        </p>
      )}
    </div>
  );
}

function Checkbox({
  children,
  error,
  ...props
}: { children: ReactNode; error?: string } & React.ComponentProps<"input">) {
  return (
    <div>
      {/* The phone mockup centres the box on its text, one line or two; the desktop one aligns it to the top. */}
      <label className="group flex cursor-pointer items-center gap-7 t-small md:items-start md:gap-25">
        <input type="checkbox" className="peer sr-only" {...props} />
        <span
          aria-hidden
          className={cn(
            "relative block size-12 shrink-0 rounded-[calc(var(--u)*2)] border border-mute bg-white transition-colors duration-200 group-hover:border-violet peer-checked:border-violet peer-checked:bg-violet peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-violet md:size-32 md:rounded-[calc(var(--u)*5)] md:border-2",
            // Tick, drawn with two borders
            "after:absolute after:left-[34%] after:top-[14%] after:h-[58%] after:w-[30%] after:rotate-45 after:border-b-[1.5px] after:border-r-[1.5px] after:border-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100 md:after:border-b-[3px] md:after:border-r-[3px]",
            error && "border-danger md:border-danger",
          )}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p role="alert" className="mt-4 text-danger t-small md:mt-10">
          {error}
        </p>
      )}
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-24 text-center md:gap-70">
      <p className="text-pretty t-body md:w-900">{children}</p>
      <Button href="/account" className="max-md:w-full">
        Перейти в личный кабинет
      </Button>
    </div>
  );
}

export function ApplyForm() {
  const router = useRouter();
  const [editId, setEditId] = useState<string>();
  const { applications, accepting, account } = useApplicationStore();
  const editing = applications?.find((item) => item.id === editId);

  const ids = useId();
  // New files, and — when editing — the already stored photos the applicant keeps.
  const [photos, setPhotos] = useState<File[]>([]);
  const [kept, setKept] = useState<Photo[]>([]);
  // Set once a new application is on the server. If a photo then fails to
  // upload, sending the form again updates that application instead of
  // creating a second one.
  const [savedId, setSavedId] = useState<string>();
  const [failure, setFailure] = useState<string | null>(null);

  const {
    register,
    control: formControl,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    mode: "onTouched",
  });
  // The prompt under the story field follows the chosen nomination; until one
  // is chosen it shows the first, as the mockup does.
  const chosen = useWatch({ control: formControl, name: "nomination" });

  // Steps of the form for the visit statistics: the first keystroke, each
  // press of the button, and which fields — by name, never by content —
  // stopped it.
  const started = useRef(false);
  const onFirstInput = () => {
    if (started.current) return;
    started.current = true;
    track("form_start");
  };

  // Editing an existing application: load it once it has arrived from the
  // server — once, so that a later refresh does not overwrite what is being typed.
  const loaded = useRef<string>(undefined);
  useEffect(() => {
    if (!editing || loaded.current === editing.id) return;
    loaded.current = editing.id;
    reset({
      name: editing.name,
      email: editing.email,
      phone: editing.phone,
      avitoId: editing.avitoId,
      city: editing.city,
      kind: editing.kind,
      field: editing.field,
      nomination: editing.nomination,
      story: editing.story,
      consentData: true,
      consentTerms: true,
      consentPromo: editing.consentPromo,
      password: "",
    });
    setKept(editing.photos);
  }, [editing, reset]);

  if (applications && !accepting) {
    return (
      <Notice>
        Приём заявок завершён. Следить за статусом поданных заявок можно в
        личном кабинете.
      </Notice>
    );
  }

  if (
    applications &&
    !editing &&
    !savedId &&
    applications.length >= MAX_APPLICATIONS
  ) {
    return (
      <Notice>
        Вы уже подали заявки в двух номинациях — это максимум. Следить за их
        статусом можно в личном кабинете.
      </Notice>
    );
  }

  const taken = new Set(
    (applications ?? [])
      .filter((item) => item.id !== editId && item.id !== savedId)
      .map((item) => item.nomination),
  );
  const nominationOptions = NOMINATIONS.map((nomination) => ({
    value: nomination.id,
    label: nomination.title,
    description: nominationNote(nomination),
    disabledReason: taken.has(nomination.id) ? "заявка уже подана" : undefined,
  }));

  // The first application opens the applicant's account: it comes with the
  // password they will sign in with. Later ones, and edits, do not ask again.
  const needsPassword = !account && !editing && !savedId;

  const onSubmit = handleSubmit(
    async (values) => {
      setFailure(null);
      if (needsPassword && values.password.length < MIN_PASSWORD) {
        track("form_error", { label: "password" });
        setError(
          "password",
          { message: `Придумайте пароль — не короче ${MIN_PASSWORD} символов` },
          { shouldFocus: true },
        );
        return;
      }
      let id = editing?.id ?? savedId;
      try {
        const saved = await saveApplication(
          {
            name: values.name,
            email: values.email,
            phone: values.phone,
            avitoId: values.avitoId,
            city: values.city,
            kind: values.kind,
            field: values.field,
            nomination: values.nomination,
            story: values.story,
            consentData: values.consentData,
            consentTerms: values.consentTerms,
            consentPromo: values.consentPromo,
            password: needsPassword ? values.password : undefined,
          },
          id,
        );
        id = saved.id;
        setSavedId(saved.id);
      } catch (error) {
        track("form_error", { label: "отправка" });
        setFailure(
          error instanceof Error
            ? error.message
            : "Не получилось отправить заявку. Попробуйте ещё раз",
        );
        return;
      }

      // The text is saved; now the photos, one request each. Every photo that
      // lands leaves the list, so trying again sends only what is still missing.
      try {
        for (const photo of editing?.photos ?? []) {
          if (!kept.some((item) => item.id === photo.id)) {
            await removePhoto(id, photo.id);
          }
        }
        for (const file of photos) {
          await uploadPhoto(id, file);
          setPhotos((current) => current.filter((item) => item !== file));
        }
      } catch (error) {
        track("form_error", { label: "фото" });
        const reason = error instanceof Error ? ` (${error.message})` : "";
        setFailure(
          `Заявка сохранена, но не все фото загрузились${reason}. Нажмите кнопку ещё раз`,
        );
        return;
      }

      await refreshApplications();
      router.push("/account");
    },
    (invalid) =>
      track("form_error", { label: Object.keys(invalid).join(", ") }),
  );

  const phone = register("phone");
  const avitoId = register("avitoId");

  const picked = NOMINATIONS.find((item) => item.id === chosen);
  const prompt = picked ?? NOMINATIONS[0];
  const brief =
    typeof prompt.brief === "string" ? prompt.brief : prompt.brief.mobile;

  return (
    <form
      noValidate
      onInput={onFirstInput}
      onSubmit={(event) => {
        track("form_submit");
        void onSubmit(event);
      }}
      data-hero-copy
      className="flex flex-col [--i:2]"
    >
      <QueryParam name="edit" onChange={setEditId} />

      <div className="flex flex-col gap-16 md:gap-50">
        <Field
          label="Имя и фамилия"
          htmlFor={`${ids}name`}
          error={errors.name?.message}
        >
          <input
            id={`${ids}name`}
            autoComplete="name"
            placeholder="Иван Иванов"
            aria-invalid={Boolean(errors.name)}
            className={input}
            {...register("name")}
          />
        </Field>

        <Field
          label="Ваша почта"
          htmlFor={`${ids}email`}
          error={errors.email?.message}
        >
          <input
            id={`${ids}email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="IvanovIvan@mail.ru"
            aria-invalid={Boolean(errors.email)}
            className={input}
            {...register("email")}
          />
        </Field>

        <Field
          label="Телефон"
          htmlFor={`${ids}phone`}
          error={errors.phone?.message}
        >
          <input
            id={`${ids}phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+7 926 123-45-67"
            aria-invalid={Boolean(errors.phone)}
            className={input}
            {...phone}
            onChange={(event) => {
              event.target.value = formatPhone(event.target.value);
              return phone.onChange(event);
            }}
          />
        </Field>

        {needsPassword && (
          <Field
            label="Пароль"
            htmlFor={`${ids}password`}
            error={errors.password?.message}
          >
            <input
              id={`${ids}password`}
              type="password"
              autoComplete="new-password"
              placeholder="Для входа в личный кабинет"
              aria-invalid={Boolean(errors.password)}
              className={input}
              {...register("password")}
            />
          </Field>
        )}

        <Field
          label="Авито ID"
          htmlFor={`${ids}avito`}
          hint="Авито ID состоит из 9 цифр. Чтобы найти его, нажмите на иконку профиля и перейдите в раздел «Управление профилем»."
          hintId={`${ids}avito-hint`}
          error={errors.avitoId?.message}
        >
          <input
            id={`${ids}avito`}
            inputMode="numeric"
            autoComplete="off"
            placeholder="123456789"
            aria-invalid={Boolean(errors.avitoId)}
            aria-describedby={`${ids}avito-hint`}
            className={input}
            {...avitoId}
            onChange={(event) => {
              // Digits only, so that a pasted "123 456 789" comes out whole.
              event.target.value = event.target.value
                .replace(/\D/g, "")
                .slice(0, 9);
              return avitoId.onChange(event);
            }}
          />
        </Field>

        <Field
          label="Укажите город"
          htmlFor={`${ids}city`}
          error={errors.city?.message}
        >
          <input
            id={`${ids}city`}
            autoComplete="address-level2"
            placeholder="Воронеж"
            aria-invalid={Boolean(errors.city)}
            className={input}
            {...register("city")}
          />
        </Field>

        <Field
          label="Выберите тип"
          labelId={`${ids}kind`}
          error={errors.kind?.message}
        >
          <Controller
            name="kind"
            control={formControl}
            render={({ field }) => (
              <Select
                labelId={`${ids}kind`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={KINDS}
                placeholder="Частный исполнитель"
                invalid={Boolean(errors.kind)}
              />
            )}
          />
        </Field>

        <Field
          label="Укажите сферу деятельности"
          htmlFor={`${ids}field`}
          error={errors.field?.message}
        >
          <input
            id={`${ids}field`}
            placeholder="Плотник"
            aria-invalid={Boolean(errors.field)}
            className={input}
            {...register("field")}
          />
        </Field>

        <Field
          label="Выберите номинацию"
          labelId={`${ids}nomination`}
          // Once chosen, what it is judged on stays in sight under it.
          hint={picked && nominationNote(picked)}
          hintId={`${ids}nomination-hint`}
          error={errors.nomination?.message}
        >
          <Controller
            name="nomination"
            control={formControl}
            render={({ field }) => (
              <Select
                labelId={`${ids}nomination`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={nominationOptions}
                describedBy={picked && `${ids}nomination-hint`}
                placeholder="Хорошие истории"
                invalid={Boolean(errors.nomination)}
              />
            )}
          />
        </Field>
      </div>

      <div className="mt-24 md:mt-105">
        <Field
          label="Расскажите о своём опыте в номинации"
          htmlFor={`${ids}story`}
          error={errors.story?.message}
        >
          <textarea
            id={`${ids}story`}
            placeholder="Занимаюсь ремонтом квартир уже 7 лет. Берусь за проекты под ключ и всегда стараюсь сделать результат лучше, чем ожидает клиент."
            aria-invalid={Boolean(errors.story)}
            aria-describedby={`${ids}story-hint`}
            className={`${control} h-104 resize-none p-10 md:h-380 md:rounded-card md:p-30`}
            {...register("story")}
          />
        </Field>

        {/*
         * What to write about, for the chosen nomination: under the field,
         * where both mockups set it and where the client wants it.
         */}
        <div className="mt-8 md:mt-25">
          <p className="t-q">
            {lines("Вопросы, которые помогут|рассказать вашу историю")}
          </p>
          <p
            id={`${ids}story-hint`}
            className="mt-8 t-small md:mt-20"
            aria-live="polite"
          >
            {prompt.hint ? lines(prompt.hint) : brief.replace(/[|^\n]/g, " ")}
          </p>
        </div>
      </div>

      <div className="mt-24 md:mt-50">
        <PhotoDrop
          files={photos}
          onChange={setPhotos}
          stored={
            editing &&
            kept.map((photo) => ({
              ...photo,
              url: photoUrl(editing.id, photo.id),
            }))
          }
          onRemoveStored={(id) =>
            setKept((current) => current.filter((photo) => photo.id !== id))
          }
        />
      </div>

      {/* The documents open in a new tab: leaving the page would lose what is typed. */}
      <div className="mt-12 flex flex-col gap-12 md:mt-40 md:gap-20">
        <Checkbox
          error={errors.consentData?.message}
          {...register("consentData")}
        >
          Я даю согласие на обработку своих персональных данных в соответствии
          с{" "}
          <a
            href={PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={documentLink}
          >
            Политикой конфиденциальности
          </a>
          .
        </Checkbox>
        <Checkbox
          error={errors.consentTerms?.message}
          {...register("consentTerms")}
        >
          Я согласен на обработку данных и{" "}
          {TERMS_URL ? (
            <a
              href={TERMS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={documentLink}
            >
              условия участия
            </a>
          ) : (
            "условия участия"
          )}
          .
        </Checkbox>
        <Checkbox
          error={errors.consentPromo?.message}
          {...register("consentPromo")}
        >
          Я согласен на публикацию моей работы в промоматериалах премии.
        </Checkbox>
      </div>

      <div className="mt-24 flex flex-col items-center gap-8 md:mt-70 md:gap-20">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full disabled:cursor-progress disabled:opacity-70 md:w-602"
        >
          {isSubmitting ? "Отправляем…" : editing ? "Сохранить" : "Отправить"}
        </Button>
        {failure && (
          <p role="alert" className="text-center text-danger t-small">
            {failure}
          </p>
        )}
      </div>
    </form>
  );
}
