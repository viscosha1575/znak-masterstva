# Znak Masterstva ("Mark of Mastery") — the Avito Services award

The website of the award for Avito Services contractors, and its admin panel.

The site and the admin panel are in Russian; the documentation is in English.

[![A walkthrough of the site on desktop and on a phone](docs/preview.webp)](docs/demo.mp4)

A 30-second excerpt; the [full walkthrough](docs/demo.mp4) (3.5 min, MP4) goes through the home
page, the contest and rating pages, the application form, and then the same site on a phone.

The repository holds two apps; each is built into its own Docker image and runs as a separate
service:

| Service    | Folder      | What it is                                                                      | Local address         |
| ---------- | ----------- | ------------------------------------------------------------------------------- | --------------------- |
| `frontend` | `frontend/` | The public site: home page, rating, contest, application form and account       | http://localhost:3000 |
| `admin`    | `admin/`    | The admin panel: moderation of applications and site statistics. Holds the data | http://localhost:3001 |

Both apps are written in Next.js 16, React 19, TypeScript and Tailwind CSS 4. Each has its own
`package.json`, dependencies and `Dockerfile`.

Only the panel has data. The site stores nothing: the application form and the personal account
work through the panel's API, which the site reaches at an internal address. So without a running
panel the site opens, but does not accept applications.

The site also sends its visit statistics there: page views, clicks, UTM tags, steps of the
application form. The panel shows them in its «Статистика» (Statistics), «Сессии» (Sessions),
«Логи» (Logs) and «UTM» sections. The site has no third-party analytics counters.

```
├── docker-compose.yml         production: both services behind Traefik
├── docker-compose.local.yml   the same services on your own machine, without a domain
├── .env.example               settings for the production stack
├── deploy/deploy.sh           deployment to the server
├── frontend/                  the site — details in frontend/README.md
└── admin/                     the admin panel — see admin/README.md
```

## Running in Docker

You need Docker with Compose (Docker Desktop, or Docker Engine with the compose plugin). For running
on your own machine there is a separate file — it needs neither a domain nor certificates:

```bash
docker compose -f docker-compose.local.yml up -d --build    # build and start both services
docker compose -f docker-compose.local.yml ps               # state of the services
docker compose -f docker-compose.local.yml logs -f frontend # logs of one service
docker compose -f docker-compose.local.yml down             # stop
```

Before the first start, create a `.env` file next to it with the login and password of the panel's
first administrator (the password must be at least 10 characters long):

```bash
ADMIN_LOGIN=admin
ADMIN_PASSWORD=come-up-with-a-long-password
```

The same file holds the mail settings for letters to participants and the rest of the panel's
settings — they are listed in [admin/README.md](admin/README.md#environment-variables).
Applications, photos and statistics live in the `admin-data` volume: `down` leaves it alone, while
`down -v` deletes it together with all the applications.

The site opens at http://localhost:3000, the panel at http://localhost:3001. If those ports are
taken, add `FRONTEND_PORT=8080` and `ADMIN_PORT=8081` to `.env`.

## Development without Docker

For everyday work on the layout you don't need Docker: a dev server on your own machine is faster
and shows changes right away. You need Node.js 20.9 or newer. Each app is started from its own
folder:

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
```

```bash
cd admin
npm install
npm run dev      # http://localhost:3001
```

The application form needs both running. Set the panel's first administrator in `admin/.env.local`
— see [admin/README.md](admin/README.md#quick-start).

## Deployment

On the server both apps run in Docker behind [Traefik](https://traefik.io): it holds ports 80 and
443, obtains Let's Encrypt certificates on its own and routes each domain to its service — the
site's own domain serves only the site, and `admin.<domain>` serves only the panel. All of this is
described in `docker-compose.yml`.

|       | Address                           | Service    |
| ----- | --------------------------------- | ---------- |
| Site  | https://znak-masterstva.avito.com | `frontend` |
| Panel | `https://admin.<domain>`          | `admin`    |

The site used to live on a former domain (`OLD_DOMAIN`). That address still answers and sends the
visitor to the same page on the new domain with a permanent 301 redirect (search engines carry the
old address over to the new one instead of keeping both in their results), so old links keep
working. This is switched on in `.env` on the server: `OLD_DOMAIN` and `COMPOSE_FILE` with
`docker-compose.moved.yml` — see `.env.example`. The panel lives on `admin.<DOMAIN>` unless
`ADMIN_DOMAIN` in `.env` gives it another name.

Deployment is one command from the repository root:

```bash
DEPLOY_HOST=root@<server> deploy/deploy.sh                          # both apps
DEPLOY_HOST=root@<server> DEPLOY_SERVICES=admin deploy/deploy.sh    # only one: frontend or admin
```

The script uploads the repository to the server (`/opt/znak-masterstva`), builds the images there
and only then restarts the containers — a failed build leaves the running site untouched. At the
end it checks that the site, the application form's API, the panel and (if `OLD_DOMAIN` is set) the
site's former address answer over HTTPS. You need SSH key access to the server
(`ssh root@<server>`); the server is given in `DEPLOY_HOST`, and a different folder can be set in
`DEPLOY_DIR`.

### What lives on the server

- `/opt/znak-masterstva/` — a copy of the repository and the settings file `.env` (template:
  `.env.example`): the domain, the email for Let's Encrypt, the panel's first administrator, the
  mail server. Deployment neither touches nor overwrites this file. After editing `.env`, apply the
  change with `docker compose up -d`.
- The data lives in Docker volumes: `avito-uslugi_admin-data` (applications, photos, statistics)
  and `avito-uslugi_traefik-letsencrypt` (certificates). `docker compose down -v` deletes the
  volumes together with all the applications — do not use it on the server.

```bash
cd /opt/znak-masterstva
docker compose ps                   # what is running
docker compose logs -f admin        # the panel's logs (traefik and frontend the same way)
docker compose restart admin        # restart one service
```

### Backups

Every night a cron job on the server runs a backup script and uploads gpg-encrypted copies to
Backblaze B2. The script is not part of this repository. A copy includes:

- the `znak.db` and `analytics.db` databases, as a snapshot taken with `deploy/znak-db-dump.sh`: it
  runs `VACUUM INTO` inside the admin container, so the copy is consistent even while the panel is
  running;
- the application photos — the `uploads/` folder of the `avito-uslugi_admin-data` volume;
- the project folder `/opt/znak-masterstva` together with `.env`.

Daily copies are kept for 14 days and Sunday copies for 8 weeks; they cannot be deleted before
then. Restoring a copy needs the private encryption key, which is held by the project owner.

What lives in the data folder is described in [admin/README.md](admin/README.md#data).

### A new server

1. Point the A records of the domain and of `admin.<domain>` at the server: without them the
   certificates will not be issued.
2. Install Docker Engine with the compose plugin. Ports 80 and 443 must be free: if nginx, Apache or
   a hosting panel holds them, turn it off.
3. Create the folder `/opt/znak-masterstva` and, in it, a `.env` based on `.env.example`.
4. Run `DEPLOY_HOST=root@<server> deploy/deploy.sh`.

If a hosting panel's nginx holds ports 80 and 443, stop it and mask it so it cannot start again
(`systemctl stop nginx && systemctl mask nginx`) — then Traefik gets the ports. The hosting panel
itself can stay; it just no longer serves the sites.

## License

The source code is published for reference. The CoFo Avito Display typeface, the Avito and Avito
Services marks, the illustrations and the copy belong to their owners and are not licensed for
reuse.
