# Admin panel and applications API

An app for the staff of the «Знак мастерства» ("Znak Masterstva", "Mark of Mastery") award:
moderation of the applications that participants submit on the site, and site visit statistics.
It also stores all the data (applications, photos, the visit log) and gives the site an API to
work with it.

In the repository this is the `admin` service. How to run it in Docker together with the site is
described in the [root README](../README.md#running-in-docker). All paths and commands below are
relative to the `admin/` folder.

There is no Figma mockup for the panel. The look is light pages with white cards and the Google
Sans font; a button in the header switches the panel to a dark theme (the choice is remembered in
the browser).

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) and React 19
- TypeScript, Tailwind CSS 4
- SQLite via Node.js's built-in `node:sqlite` module, so no separate database server is needed
- sharp for photo previews; nodemailer for emails to participants; Zod for validating the form
- react-icons for icons; charts are drawn by our own component (`src/components/panel/Chart.tsx`),
  without libraries

## Quick start

Requires Node.js 22.13 or newer (24 on the server and in Docker).

```bash
npm install
npm run dev      # http://localhost:3001
```

The panel creates the first administrator from environment variables. For development, put them in
a `.env.local` file (it is not committed to git):

```bash
ADMIN_LOGIN=admin
ADMIN_PASSWORD=at-least-ten-characters
```

Other commands:

```bash
npm run build    # production build (.next/standalone)
npm run lint     # ESLint check
```

For the application form on the site to work locally, run the site alongside it
(`cd ../frontend && npm run dev`): it finds the panel on port 3001 by itself.

## Panel sections

| Path                     | What it is                                                                                          | Who can access |
| ------------------------ | --------------------------------------------------------------------------------------------------- | -------------- |
| `/`                      | «Обзор» (Overview): applications by status and nomination, the site today, events                     | everyone       |
| `/applications`          | List of applications: statuses, search, filters, CSV export of the table                            | everyone       |
| `/applications/<number>` | An application: the story, photos, contacts, where the participant came from, the decision, history | everyone       |
| `/statistics`            | «Статистика сайта» (Site statistics): visitors, sessions, form funnel, sources, clicks              | everyone       |
| `/sessions`              | «Сессии» (Sessions): every visit to the site; inside, all of the visitor's actions in order         | everyone       |
| `/logs`                  | «Логи» (Logs): a log of all site events with search and a filter by action                          | everyone       |
| `/utm`                   | UTM: visits, new visitors and applications for each tag                                             | everyone       |
| `/profile`               | «Профиль» (Profile): change your own password                                                       | everyone       |
| `/staff`                 | «Сотрудники» (Staff): add, disable, change role or password                                         | administrators |
| `/settings`              | Open and close the application intake                                                               | administrators |

There are two roles. A **moderator** reads applications, accepts and rejects them, leaves notes and
exports the table. An **administrator** can additionally manage staff and settings and can delete
an application.

### How moderation works

- A new application gets the status «На модерации» (Under review). A moderator accepts it or
  rejects it with a reason; the decision can be reverted.
- If a participant edits the application on the site (text or photos), it goes back to moderation,
  whatever decision was made before. What exactly changed is shown in the application's history.
- The participant learns about the decision from an email (if mail is configured, see below). The
  rejection reason goes into the email in full, so it is worth writing it so that the participant
  understands what to improve.
- Notes are visible to staff only.
- Two moderators cannot overwrite each other's decisions: if the status changed while the
  application was open, the panel will not save the decision and will ask to take another look.
- The «Похожие заявки» (Similar applications) block shows applications from the same browser,
  or with the same email, phone or Avito ID (applications submitted before the form started asking
  for the ID have a profile link instead). The site checks the "no more than two applications" rule
  by browser only, so repeat applications from the same person show up here.

All times are shown in Moscow time.

## Site statistics

The site itself reports to the panel what happens on it (`frontend/src/lib/analytics.ts`); there
are no third-party counters. The panel stores this in a separate database and shows it in four
sections.

**What is recorded.** Page views, clicks on buttons and links (the element's label and where it
leads), scroll depth, time on page, form steps (opened, started filling in, pressed «Отправить»
(Submit), which fields failed validation) and application submission. For the first visit, where
the visitor came from: UTM tags from the URL and the site they came from.

**What is not recorded.** Nothing that a participant types into the form: for errors only the field
names are known. There are no IP addresses, and only three words are kept from the user agent
string: device, browser, OS. The referrer URL is stored without query parameters.

**Visitor and session.** A visitor is a browser: on the first page view it gets a `znak_visitor`
cookie with a random number (for a year, not accessible to scripts; the database stores only its
hash). A session is one visit to the site: it ends after 30 minutes of inactivity, and following a
link with a different UTM tag starts a new one. An application remembers the session in which it
was submitted: the application card has an «Откуда пришёл» (Where they came from) block, and the
CSV export has columns with the source and tags.

**Why it is fast at any volume.** The report figures are daily counters that are updated at the
moment an event is written, in the same transaction. A report adds up a few hundred rows and does
not look into the log, however many millions of events it holds; unique visitors for any period
are also computed from counters, exactly. The log and the list of sessions are read page by page by
row id: the first page and the hundred-thousandth cost the same. Text search scans the log
sequentially and is therefore limited in time: if a page has not filled up within a fraction of a
second, the panel shows how far it got and offers to keep searching. All of this is described at
the top of `src/lib/analytics/store.ts` and `src/lib/analytics/log.ts`.

Tested on a developer laptop: with a log of 7 million events and 1 million sessions (an 800 MB
database), the statistics, sessions, logs and UTM pages are served in 10–20 ms, a search with no
matches at all takes less than 0.2 s, and event intake handles about a thousand batches per second.

**Retention.** The event log and sessions are kept for `ANALYTICS_KEEP_DAYS` days (180 by default),
after which the oldest records are gradually deleted. Counters are never deleted: reports for past
periods stay accurate, it is just that a session older than the retention period can no longer be
opened step by step.

**Protection against inflated numbers.** The event intake endpoint is open to everyone, so all
incoming data is truncated in length, and every list has a cap: pages, button labels and sources
per day, UTM tags 5000 in total; values above the cap are lumped into an «(другое)» ("other") row.
The number of requests and new visitors from one address is limited. Bots are filtered out by user
agent string.

**Cookies and the law.** The site now sets a statistics cookie for visitors. There is no cookie
notice on the site; its text and look should be agreed with a lawyer and a designer before launch.

## Data

Everything the panel stores lives in one folder, `DATA_DIR`:

```
znak.db            SQLite database: applications, participant accounts, staff, history, settings
analytics.db       SQLite database: site statistics, the visit log and counters
uploads/<number>/  application photos: the original and two WebP previews
```

In development this is `admin/data/` (not committed to git); in Docker it is the `admin-data`
volume, which the image mounts as `/data`. When running the production build without Docker,
`DATA_DIR` must be set explicitly, and the folder must be **outside** the app folder.

**A backup** is a copy of the `DATA_DIR` folder. While the panel is running, the database is more
reliably copied with `sqlite3 znak.db ".backup 'znak-backup.db'"`, and the photos with a plain
copy. How to take a backup from a server where the panel runs in a container is described in the
["Deployment"](#deployment) section. Nightly automatic backups are covered under "Backups" in the
[root README](../README.md#backups). `analytics.db` is copied the same way; it can be large, and
losing it is not as bad as losing the applications, which is why the statistics live in a separate
file.

The database schemas are defined as lists of migrations: `src/lib/db.ts` for applications,
`src/lib/analytics/store.ts` for statistics. To change a schema, append a new item to the list; do
not edit the ones already applied.

## Environment variables

| Variable              | Purpose                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `DATA_DIR`            | Folder with the database and photos. Required in production                                     |
| `ADMIN_LOGIN`         | Login of the first administrator                                                                |
| `ADMIN_PASSWORD`      | Their password, at least 10 characters                                                          |
| `SMTP_URL`            | Mail server for emails to participants: `smtps://login:password@smtp.example.ru:465`            |
| `MAIL_FROM`           | Sender of the emails: `Премия «Знак мастерства» <award@example.ru>`                             |
| `MAIL_REPLY_TO`       | Where replies to the emails go, if not to `MAIL_FROM`                                           |
| `SITE_URL`            | Site address, e.g. `https://konkurs.example.ru`: emails will contain a link to the account page |
| `ANALYTICS_KEEP_DAYS` | How many days to keep the visit log. 180 by default; `0` keeps everything                       |

`ADMIN_LOGIN` and `ADMIN_PASSWORD` are read only while the panel has no accounts at all. After the
first sign-in, change the password in the panel and remove the variables.

Without `SMTP_URL` and `MAIL_FROM` the panel works but sends no emails, and it warns the moderator
about this at the moment of the decision. The email texts are in `src/lib/letters.ts`.

## API for the site

The site talks to the panel over an internal address (`API_URL` in its settings): the participant's
browser calls the site's `/api/...`, and the site forwards the request here, to `/api/public/...`.

| Request                                                  | What it does                                              |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `GET /api/public/applications`                           | The participant's applications and whether intake is open |
| `POST /api/public/applications`                          | Submit an application                                     |
| `PUT /api/public/applications/<id>`                      | Edit your own application                                 |
| `POST /api/public/applications/<id>/photos`              | Add a photo: the request body is the file itself          |
| `GET /api/public/applications/<id>/photos/<photo id>`    | Preview of your own photo                                 |
| `DELETE /api/public/applications/<id>/photos/<photo id>` | Remove a photo                                            |
| `POST /api/public/session`                               | Sign in to the account: phone or email and password       |
| `POST /api/public/account`                               | Set a password for applications submitted without one     |
| `DELETE /api/public/session`                             | Sign out: the browser stops being a participant           |
| `POST /api/public/activity`                              | Record visitor actions (statistics)                       |

The panel recognises a participant by a cookie. It is set by the first application, which also
opens the participant's account: the email and phone from the form and the password they chose
(`src/lib/accounts.ts`, the `accounts` table). When a participant signs in to the account from
another browser, they get their own cookie there, bound to the same account (the `logins` table).
A second account cannot be opened for an email or phone that already has one. Someone else's
application cannot be read or changed through this API. The visitor cookie for statistics is a
separate one and gives no access to applications.

Without an account, applications are neither returned nor changed; a cookie alone is not enough.
Applications submitted before accounts were introduced are bound only to a cookie: for such a
participant `GET /api/public/applications` returns an empty list and the `passwordNeeded` flag,
and the site asks them to choose a password (`POST /api/public/account`). The account is opened
for the email and phone of the first of these applications.

The server validates the form again, by the same rules as the form on the site
(`src/lib/validation.ts`). The list of nominations and participant types is duplicated in
`src/lib/dictionaries.ts`: when you add a nomination on the site, add it here too.

## Security

- Sign-in is by login and password. Passwords are stored as hashes (scrypt), a session lasts 14
  days. After ten failed attempts, sign-in for that login is locked for 15 minutes.
- Site participants' passwords are stored the same way, as hashes. Account sign-in is rate-limited:
  ten failed attempts per hour per login and thirty attempts per ten minutes from one address. A
  wrong login and a wrong password get the same response and take the same time.
- Every page, action and route of the panel checks by itself that the request came from a staff
  member (`src/lib/auth.ts`). When adding a new page or action, start it with `requireUser()` or
  `requireAdmin()`.
- An uploaded file is checked by its content, not its name: only images are accepted. The panel
  renders previews itself; the original is served only as a downloadable file.
- In the CSV export, cells that look like formulas are neutralised.
- Statistics intake accepts data from anyone, so it trusts nothing in it: see
  ["Protection against inflated numbers"](#site-statistics).
- The apps' ports are not exposed: only Traefik leads to the panel, over HTTPS and only from its
  domain. If the panel is needed only from the office, restrict access to its domain by IP; in
  Traefik this is the `ipAllowList` middleware on the `znak-admin` router. The site uses the
  `/api/public/` path over the internal address, so this will not affect it.

## Deployment

The panel lives at `https://admin.<domain>` (the site at `https://znak-masterstva.avito.com`) and is
deployed together with the site, with one command from the repository root:

```bash
deploy/deploy.sh                          # site and panel
DEPLOY_SERVICES=admin deploy/deploy.sh    # panel only
```

On the server the panel runs in a Docker container behind Traefik, which issues the certificate and
routes only the panel's domain to it. How this is set up is described in the
[root README](../README.md#deployment).

- **Settings** (the variables from the table above) are in the `/opt/znak-masterstva/.env` file on
  the server. After editing it, apply the change: `docker compose up -d` in the same folder.
- **The first administrator** is created from `ADMIN_LOGIN` and `ADMIN_PASSWORD` in that file. Look
  up the password there too: `ssh root@<server> grep ADMIN /opt/znak-masterstva/.env`. After the
  first sign-in, change it in the panel (the «Профиль» (Profile) section) and delete both lines
  from the file.
- **Data** lives in the Docker volume `avito-uslugi_admin-data`; inside the container it is
  `/data`. Deployment does not touch it. A backup of the database from the running panel:

  ```bash
  mkdir -p /opt/znak-backups && chmod 700 /opt/znak-backups
  cd /opt/znak-masterstva
  docker compose exec admin node -e "new (require('node:sqlite').DatabaseSync)('/data/znak.db').exec(\"VACUUM INTO '/data/backup-znak.db'\")"
  docker compose cp admin:/data/backup-znak.db /opt/znak-backups/znak-$(date +%F).db
  docker compose exec admin rm /data/backup-znak.db
  docker compose cp admin:/data/uploads /opt/znak-backups/uploads-$(date +%F)
  ```

  Keep backups outside `/opt/znak-masterstva`: deployment syncs that folder to the repository
  contents and deletes extra files from it.

  Statistics (`analytics.db`) are copied the same way. The backups contain participants' personal
  data: store them wherever the database itself is supposed to be stored.
