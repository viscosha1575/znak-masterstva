import { z } from "zod";
import type { ApplicationInput } from "@/lib/applications";
import { KINDS, NOMINATIONS } from "@/lib/dictionaries";

/** +7 926 123-45-67 from any spelling of an eleven-digit Russian number. */
function formatPhone(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (digits.length !== 11 || !digits.startsWith("7")) return null;
  return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
}

const CONSENT_REQUIRED = "Без согласия мы не сможем принять заявку";

/*
 * The same rules as the form on the site (frontend/src/components/apply/
 * ApplyForm.tsx), plus upper bounds: the form is a convenience, this is the
 * check. Messages are shown to the applicant as they are.
 */
const schema = z.object({
  name: z
    .string()
    .trim()
    .max(120, "Слишком длинное имя")
    .regex(/\S+\s+\S+/, "Укажите имя и фамилию"),
  email: z.email("Проверьте адрес почты").max(200, "Проверьте адрес почты"),
  phone: z
    .string()
    .max(40, "Введите номер полностью")
    .transform((value, context) => {
      const phone = formatPhone(value);
      if (phone) return phone;
      context.addIssue({ code: "custom", message: "Введите номер полностью" });
      return z.NEVER;
    }),
  avitoId: z.string().trim().regex(/^\d{9}$/, "Авито ID — это 9 цифр"),
  city: z.string().trim().min(2, "Укажите город").max(100, "Укажите город"),
  kind: z.enum(
    KINDS.map((kind) => kind.id),
    "Выберите тип",
  ),
  field: z
    .string()
    .trim()
    .min(2, "Укажите сферу деятельности")
    .max(150, "Укажите сферу деятельности короче"),
  nomination: z.enum(
    NOMINATIONS.map((nomination) => nomination.id),
    "Выберите номинацию",
  ),
  story: z
    .string()
    .trim()
    .min(40, "Расскажите чуть подробнее — хотя бы пару предложений")
    .max(10_000, "Рассказ слишком длинный — сократите до 10 000 знаков"),
  // All three consents are required.
  consentData: z.literal(true, CONSENT_REQUIRED),
  consentTerms: z.literal(true, CONSENT_REQUIRED),
  consentPromo: z.literal(true, CONSENT_REQUIRED),
});

export function parseApplication(
  body: unknown,
): { input: ApplicationInput } | { error: string } {
  const result = schema.safeParse(body);
  if (!result.success) return { error: result.error.issues[0].message };

  const data = result.data;
  return {
    input: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      avitoUrl: data.avitoId,
      city: data.city,
      kind: data.kind,
      field: data.field,
      nomination: data.nomination,
      story: data.story,
      consentPromo: data.consentPromo,
    },
  };
}
