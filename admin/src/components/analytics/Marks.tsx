import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { Visit } from "@/lib/analytics/log";
import { cn } from "@/lib/cn";
import {
  EVENT_TITLES,
  type EventType,
  UTM_FIELDS,
  type Utm,
} from "@/lib/analytics/types";

/*
 * The small coloured labels of the analytics pages: where a visit came from,
 * how far it got, what kind of event a log row is.
 */

/**
 * The tags of a link, most general first; hovering one says which parameter
 * it is. Shown as typed: "VK" and "vk" are different tags.
 */
export function UtmBadges({ utm, nowrap }: { utm: Utm; nowrap?: boolean }) {
  return (
    <span className={cn("flex gap-1.5", !nowrap && "flex-wrap")}>
      {UTM_FIELDS.filter((field) => utm[field]).map((field) => (
        <Badge key={field} tone="purple" title={`utm_${field}`} verbatim>
          {utm[field]}
        </Badge>
      ))}
    </span>
  );
}

/** How a visit went, at a glance. */
export function VisitBadges({ visit }: { visit: Visit }) {
  const stage: [BadgeTone, string] | null =
    visit.applications > 0
      ? ["green", visit.applications > 1 ? "Заявки" : "Заявка"]
      : visit.funnel === 3
        ? ["orange", "Не отправил анкету"]
        : visit.funnel === 2
          ? ["blue", "Начал анкету"]
          : visit.funnel === 1
            ? ["gray", "Открыл анкету"]
            : null;

  return (
    <span className="flex flex-wrap gap-1.5">
      {visit.online && <Badge tone="green">На сайте</Badge>}
      <Badge tone={visit.isNew ? "blue" : "gray"}>
        {visit.isNew ? "Новый" : "Вернулся"}
      </Badge>
      {stage && <Badge tone={stage[0]}>{stage[1]}</Badge>}
    </span>
  );
}

const eventTones: Record<EventType, BadgeTone> = {
  view: "gray",
  click: "purple",
  scroll: "gray",
  form_start: "blue",
  form_submit: "blue",
  form_error: "orange",
  sent: "green",
  leave: "gray",
};

export function EventBadge({ type }: { type: EventType }) {
  return <Badge tone={eventTones[type]}>{EVENT_TITLES[type]}</Badge>;
}

// The form reports its fields by the names it gives them in code
// (frontend/src/components/apply/ApplyForm.tsx).
const FORM_FIELDS: Record<string, string> = {
  name: "имя",
  email: "почта",
  phone: "телефон",
  avitoId: "Авито ID",
  city: "город",
  kind: "тип",
  field: "сфера",
  nomination: "номинация",
  story: "рассказ",
  consentData: "согласие на обработку данных",
  consentTerms: "согласие с условиями участия",
  consentPromo: "согласие на публикацию",
};

/** What a log row has to say beyond its type and page. */
export function eventDetails(event: {
  type: EventType;
  label: string;
  target: string;
  value: number | null;
}) {
  switch (event.type) {
    case "click":
      return event.target ? `${event.label} → ${event.target}` : event.label;
    case "scroll":
      return `До ${event.value ?? 0} % страницы`;
    case "leave":
      return event.value ? `Провёл на странице ${seconds(event.value)}` : "";
    case "form_error":
      return event.label
        ? `Не прошли проверку: ${event.label
            .split(", ")
            .map((field) => FORM_FIELDS[field] ?? field)
            .join(", ")}`
        : "";
    case "sent":
      return [event.value ? `Заявка № ${event.value}` : "Заявка", event.label]
        .filter(Boolean)
        .join(" · ");
    default:
      return event.label;
  }
}

function seconds(ms: number) {
  const total = Math.round(ms / 1000);
  return total < 60
    ? `${total} с`
    : `${Math.floor(total / 60)} мин ${total % 60} с`;
}
