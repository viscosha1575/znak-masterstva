import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MdArrowBack, MdArrowForward } from "react-icons/md";
import { DecisionPanel } from "@/components/applications/DecisionPanel";
import { DeleteApplication } from "@/components/applications/DeleteApplication";
import { NoteForm } from "@/components/applications/NoteForm";
import { UtmBadges } from "@/components/analytics/Marks";
import { PhotoGallery } from "@/components/applications/PhotoGallery";
import { Fact, Panel, Pill } from "@/components/panel/Blocks";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { findVisit } from "@/lib/analytics/log";
import { DEVICE_TITLES, sourceTitle } from "@/lib/analytics/types";
import {
  findApplication,
  listEvents,
  nextInQueue,
  relatedApplications,
} from "@/lib/applications";
import { requireUser } from "@/lib/auth";
import { kindTitle, nominationTitle } from "@/lib/dictionaries";
import { describeEvent } from "@/lib/events";
import { formatBytes, formatDateTime } from "@/lib/format";
import { accountUrl, mailConfigured } from "@/lib/mail";
import { listPhotos } from "@/lib/photos";

type Props = PageProps<"/applications/[id]">;

async function load(props: Props) {
  // First, always: the title below is read from the application too.
  const user = await requireUser();
  const id = Number((await props.params).id);
  const application = Number.isInteger(id) ? findApplication(id) : undefined;
  return { user, application };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { application } = await load(props);
  return {
    title: application
      ? `Заявка № ${application.id} — ${application.name}`
      : "Заявка не найдена",
  };
}

export default async function ApplicationPage(props: Props) {
  const { user, application } = await load(props);
  if (!application) notFound();

  const photos = listPhotos(application.id);
  const events = listEvents(application.id);
  const related = relatedApplications(application.id);
  const next = nextInQueue(application.id);
  // Applications from before the form asked for the Avito ID carry a link to the profile.
  const profileUrl = /^\d+$/.test(application.avitoUrl)
    ? null
    : /^https?:\/\//i.test(application.avitoUrl)
      ? application.avitoUrl
      : `https://${application.avitoUrl}`;

  const origin = application.origin;
  // The visit may have aged out of the log; its summary stays with the application.
  const visit = origin && findVisit(origin.sessionId);

  return (
    <div className="flex flex-col gap-5">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <h2 className="text-2xl leading-tight font-bold text-balance break-words text-ink md:text-4xl">
              {application.name}
            </h2>
            <p className="mt-1.5 text-sm text-mute">
              Подана {formatDateTime(application.createdAt)}
              {application.updatedAt !== application.createdAt &&
                ` · изменена ${formatDateTime(application.updatedAt)}`}
            </p>
          </div>
          <ButtonLink href="/applications" size="sm">
            <MdArrowBack aria-hidden className="size-[18px]" />
            Все заявки
          </ButtonLink>
        </div>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <StatusBadge status={application.status} />
          <Badge tone="purple">{nominationTitle(application.nomination)}</Badge>
          <Badge>{kindTitle(application.kind)}</Badge>
          {application.consentPromo && (
            <Badge tone="green">Согласен на публикацию</Badge>
          )}
        </div>
      </Panel>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <Panel title="Рассказ участника">
            <p className="max-w-[75ch] text-base leading-relaxed whitespace-pre-wrap break-words text-text">
              {application.story}
            </p>
          </Panel>

          <Panel
            title="Фото работ"
            aside={photos.length > 0 && <Pill>{photos.length}</Pill>}
          >
            {photos.length > 0 ? (
              <PhotoGallery
                photos={photos.map((photo) => ({
                  id: photo.id,
                  name: photo.name,
                  hasPreview: photo.hasPreview,
                  details: [
                    formatBytes(photo.size),
                    photo.width && `${photo.width} × ${photo.height}`,
                  ]
                    .filter(Boolean)
                    .join(" · "),
                }))}
              />
            ) : (
              <p className="text-sm text-mute">Участник не приложил фото.</p>
            )}
          </Panel>

          <Panel title="Участник">
            <dl className="grid gap-4 rounded-[1.25rem] bg-subtle p-5 sm:grid-cols-2 xl:grid-cols-3">
              <Fact label="Почта">
                <a href={`mailto:${application.email}`} className={link}>
                  {application.email}
                </a>
              </Fact>
              <Fact label="Телефон">
                <a
                  href={`tel:${application.phone.replace(/[^\d+]/g, "")}`}
                  className={link}
                >
                  {application.phone}
                </a>
              </Fact>
              <Fact label="Город">{application.city}</Fact>
              <Fact label="Авито ID" className="sm:col-span-2">
                {profileUrl ? (
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={link}
                  >
                    {application.avitoUrl}
                  </a>
                ) : (
                  application.avitoUrl
                )}
              </Fact>
              <Fact label="Тип">{kindTitle(application.kind)}</Fact>
              <Fact label="Сфера деятельности" className="sm:col-span-2">
                {application.field}
              </Fact>
              <Fact label="Публикация в промо">
                {application.consentPromo ? "Согласен" : "Не согласен"}
              </Fact>
            </dl>
          </Panel>

          <Panel
            title="Откуда пришёл"
            lead={
              origin
                ? undefined
                : "Визит не записан: заявка подана до включения статистики, либо браузер участника её блокирует."
            }
            aside={
              visit && (
                <ButtonLink
                  href={`/sessions/${visit.id}`}
                  variant="soft"
                  size="xs"
                >
                  Сессия № {visit.id}
                </ButtonLink>
              )
            }
          >
            {origin && (
              <dl className="grid gap-4 rounded-[1.25rem] bg-subtle p-5 sm:grid-cols-2 xl:grid-cols-3">
                <Fact label="Источник">{sourceTitle(origin.source)}</Fact>
                <Fact label="UTM-метка" className="sm:col-span-2">
                  {origin.utm ? <UtmBadges utm={origin.utm} /> : "Без метки"}
                </Fact>
                <Fact label="Перешёл с">{origin.referrer || "—"}</Fact>
                <Fact label="Первая страница">{origin.landing}</Fact>
                <Fact label="Устройство">
                  {DEVICE_TITLES[origin.device] ?? origin.device} ·{" "}
                  {origin.browser} · {origin.os}
                </Fact>
                <Fact label="Посетитель">
                  № {origin.visitorId} ·{" "}
                  {origin.visit > 1
                    ? `${origin.visit}-й заход на сайт`
                    : "первый заход на сайт"}
                </Fact>
              </dl>
            )}
          </Panel>

          <Panel title="Заметки и история">
            <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <NoteForm applicationId={application.id} />
              <ol className="flex flex-col gap-4">
                {events.map((event) => {
                  const { title, body } = describeEvent(event);
                  return (
                    <li
                      key={event.id}
                      className="border-l-2 border-line pl-3.5"
                    >
                      <p className="text-sm font-bold text-ink">{title}</p>
                      {body && (
                        <p className="mt-1 text-sm whitespace-pre-wrap break-words text-soft">
                          {body}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-mute">
                        {event.author ? `${event.author} · ` : ""}
                        {formatDateTime(event.createdAt)}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </Panel>
        </div>

        {/* Stays on screen while the story and photos scroll: the decision is always at hand. */}
        <aside className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-[115px]">
          <Panel
            title="Решение"
            lead={
              application.status === "moderation"
                ? "Заявка ждёт решения модератора."
                : `${application.status === "approved" ? "Принята" : "Отклонена"} ${formatDateTime(application.moderatedAt!)}${application.moderatedBy ? ` · ${application.moderatedBy}` : ""}`
            }
          >
            {application.rejectReason && (
              <blockquote className="mb-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm whitespace-pre-wrap break-words text-danger-ink">
                {application.rejectReason}
              </blockquote>
            )}
            <DecisionPanel
              application={{
                id: application.id,
                name: application.name,
                email: application.email,
                nomination: application.nomination,
                status: application.status,
              }}
              mail={mailConfigured()}
              accountUrl={accountUrl()}
            />
            {next && (
              <Link
                href={`/applications/${next}`}
                className={`mt-4 inline-flex items-center gap-1 text-sm ${link}`}
              >
                Следующая в очереди — № {next}
                <MdArrowForward aria-hidden className="size-4" />
              </Link>
            )}
          </Panel>

          {related.length > 0 && (
            <Panel
              title="Похожие заявки"
              lead="Поданы из того же браузера либо с той же почтой, телефоном или профилем."
            >
              <ul className="flex flex-col gap-1">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/applications/${item.id}`}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-subtle"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-ink">
                          № {item.id} · {nominationTitle(item.nomination)}
                        </span>
                        <span className="block truncate text-xs text-mute">
                          {item.sameParticipant ? "Тот же участник" : item.name}
                        </span>
                      </span>
                      <StatusBadge status={item.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {user.role === "admin" && (
            <DeleteApplication
              application={{ id: application.id, name: application.name }}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

const link =
  "font-semibold break-all text-accent underline-offset-4 hover:underline";
