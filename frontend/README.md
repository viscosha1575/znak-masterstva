# Znak Masterstva ("Mark of Mastery") award website

The website of the award for service providers on Avito Services. It tells visitors about the rating
and the contest, accepts participants' application forms by nomination and shows the status of
their applications in the personal account.

The site keeps no data of its own: applications and photos are stored by the admin panel (the
`admin` service), and the site works with them through its API — see [Applications](#applications).

In the repository this is the `frontend` service. How to run it in Docker together with the admin
panel is described in the [root README](../README.md#running-in-docker). All paths and commands
below are relative to the `frontend/` folder.

Built from the Figma mockup at two widths:
1920 — the «Десктоп_…» (Desktop_…) frames, 360 — the other frames on the same page, Page 1.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) and React 19
- TypeScript
- Tailwind CSS 4
- Animation in CSS; Lenis for inertial mouse-wheel scrolling
- React Hook Form and Zod — the application form and its validation

## Quick start

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev      # http://localhost:3000
```

The pages open right away. For the application form and the personal account to work, start the
panel alongside (`cd ../admin && npm run dev`): the site finds it on port 3001 by itself.

Other commands:

```bash
npm run build    # production build (.next/standalone), all pages are static
npm run start    # run the built site
npm run lint     # ESLint check
```

## Pages

| Path       | What it is                                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `/`        | Home                                                                                                                                      |
| `/rating`  | «О рейтинге» (About the rating)                                                                                                           |
| `/contest` | «О конкурсе» (About the contest)                                                                                                          |
| `/apply`   | Application form (`/apply?edit=<id>` — editing an application)                                                                            |
| `/account` | Personal account (`?demo=0`…`3` — mockup screens: sign-in, one application, two, rejected; `4` — «Придумайте пароль» (Create a password)) |

## Project structure

```
src/
├── app/                 routes, global styles and fonts; app/api — bridge to the panel's API
├── components/
│   ├── sections/        blocks shared by several pages (hero, stages, awards)
│   ├── home/            home page blocks
│   ├── contest/         blocks of the «О конкурсе» page
│   ├── apply/           application form
│   ├── account/         personal account
│   ├── layout/          header, footer, page frame
│   ├── motion/          animation: reveal, card tilt, image rotation, scrolling
│   └── ui/              button, logo, light spots, arcs, disc, glass
├── content/             texts: stages, FAQ, nominations, menu
├── assets/              images (WebP) and SVG from Figma
└── lib/                 applications, shared animation code (motion.ts, scroll.ts), statistics
scripts/glow/            rebuilds the glows that Figma cannot export (see "Images")
```

## How the layout works

### The size unit

The mockup has two widths — 360 and 1920, nothing in between. So all sizes are given in "mockup
pixels" and scale together with the page frame through the `--u` variable (`src/app/globals.css`):
below 768px the unit equals a pixel of the 360 mockup, above that a pixel of the 1920 mockup.

On a phone the frame is the whole screen. On desktop it is narrower than the screen: `--zoom` (0.85)
of its width, centred, so that on a large monitor the page does not feel oversized. A narrow window,
up to 1024px, keeps the full width — otherwise the text would get too small; beyond 1920 the frame
stops growing. The hero background extends past the frame to the edges of the screen (`--bleed`,
`components/sections/Niche.tsx`), and the object on the stone, which the mockup cuts off at the edge
of the screen, fades out smoothly past the edge of the frame. How much to shrink the page is a
single number, `--zoom`.

On desktop the application form is even more compact (`md:compact` in `src/app/apply/page.tsx`):
inside it the unit is three quarters of the normal one, but no less than 0.42px.

The Tailwind spacing scale is tied to `--u`, so `w-830` means 830px from the mockup. Typography uses
the utilities `t-h2`, `t-h3`, `t-body` and so on; each of them already has the mobile and desktop
sizes from the Figma text styles built in.

### Two mockups

The mobile mockup is not a scaled-down desktop one, but both have the same blocks: the hero with
the object on the stone, glass cards, awards, stages, FAQ. So each block has a single markup, and
sizes and coordinates are given in pairs: `top-68 md:top-220.75`. Separate branches (`md:hidden` /
`max-md:hidden`) remain where the mockups are built differently: the awards carousel on the phone
versus the grid on desktop, the order of the rating criteria, the glows.

The page starts under the header and ends under the footer — both have rounded corners, and the
page background shows behind them (`components/layout/Page.tsx`). Coordinates are therefore
measured from the top of the mockup frame, header included.

In headings, individual letters are set in alternate glyphs of the typeface (a loop in «а», «е»,
«о», a slanted «р»). They are marked up right in the string and rendered by the same `lines()` as
line breaks: `{а}` — stylistic sets ss06 and ss07, `[р]` — ss07 only. In two headings the mockups
highlight different letters — there the string is given as a pair, `lines({ mobile, desktop })`.
Figma's export does not carry these glyphs over faithfully: check the letters against the mockup
image.

When comparing the layout with the mockup pixel by pixel, keep in mind two quirks of Figma's
rendering. On the phone it places large headings half a pixel lower than the browser places the
same block — these headings have the classes `max-md:pt-0.5 max-md:-mb-0.5` (see the comment next
to `t-h2` in `globals.css`). And it draws a blur of radius r as a Gaussian with σ = 0.415·r,
although it writes r/2 into the export — that is where the numbers in the [Images](#images) and
[Glass](#glass) sections come from.

### Typeface

CoFo Avito Display is the brand typeface from the mockup, in three weights (Regular, Medium, Bold).
The files are in `src/app/fonts` in WOFF2 format and are loaded in `src/app/layout.tsx` through
`next/font/local`, so they are served from the same domain, with no requests to third-party
services. The typeface is licensed to Avito and is included here with the client's permission; it is
not licensed for use in other projects.

The fourth weight, Light, is only needed for the large numbers on the rating criteria cards, so its
file contains digits only (`CoFoAvitoDisplay-Light-digits.woff2`, 1 KB).

### Line breaks

The layout scales as a whole, so text wraps the same way on any screen within one mockup. This makes
it possible to reproduce the designer's line breaks literally. In the texts they are marked up right
in the strings and rendered by the `lines()` function (`src/lib/lines.tsx`):

| Mark | Meaning               |
| ---- | --------------------- |
| `\n` | break on both mockups |
| `\|` | break on mobile only  |
| `^`  | break on desktop only |

If the text itself differs between the two mockups, not just the line breaks, pass both variants:
`lines({ mobile: "…", desktop: "…" })` — each is shown only on its own mockup.

At the moment the mockups differ in wording in places (see [Before launch](#before-launch)), and
each layout follows its own mockup. This is temporary: once the texts are agreed, bring both to the
same wording.

When changing text, check the line breaks in the browser at 360 and 1920. FAQ questions do not wrap
by themselves: if a question does not fit on one line, break it manually — otherwise the arrow
drifts away from the text.

### Images

The renders are listed in `src/assets/art.ts` (`ART`) and rendered by `Picture`. Each has two files:
a full one in `src/assets/images` — twice the size of the block in the 1920 mockup, so that the
image is sharp on retina screens — and a light one for phones in `src/assets/images/mobile`, three
times wider than the image appears on a 360px screen. The browser downloads one of the two, already
compressed for its screen (`next/image`).

- **The files are built from the originals.** A regular asset export from Figma returns the renders
  downscaled to 1024px, although in the mockup file they are up to 4096px wide (the layer fill,
  `rawImages` in Figma's asset export). The site's file is the original, fitted
  into the block the same way the fill fits it (cropped by `imageTransform` or fitted whole), with
  the fill's colour adjustment — temperature, tint, saturation: the original itself does not have
  it. When replacing an image, compare the result with the layer export from Figma.
- **The layout sets the proportions.** An image gets the width and height of the block from the
  mockup; on desktop the prizes are fitted into the block (`object-contain`). `object-cover` would
  distort the object.
- **The disc** behind the headings is a single file; the fade towards its edge is a CSS mask
  (`disc-fade`, `components/ui/Disc.tsx`). In the mockup the disc's fill not only crops the original
  but also rotates it by 21° (`imageTransform` with tilted axes) — a plain crop would leave the lit
  edge on the wrong side. The site's file is built with this rotation.
- **The light streak** in the mockup lies under frosted glass — this blur is baked into the
  `streak.webp` files.
- **Glows** are SVGs from Figma in `src/assets/svg`, rendered by `Blob`. In the files `stdDeviation`
  is already multiplied by 0.83 (the correction from r/2 to 0.415·r). A progressive blur, whose
  radius changes along the shape, Figma does not export to SVG at all — it leaves a weak uniform one
  instead. Nine such glows are stored as images in `src/assets/images/glow`; they are built by
  `scripts/glow/build.py` from the source SVGs (`scripts/glow/sources`) and the blur parameters from
  Figma — how exactly is described in the script's header.

### Animation

All animation is CSS: transitions and keyframes on `transform` and `opacity`, which the browser runs
on a separate thread. Scripts only toggle an attribute when something appears on screen, or set a
value when the cursor moves; none of them runs on every frame. So the page computes nothing at rest,
and animations stay smooth even on a slow CPU. Shared code is in `src/lib/motion.ts`, the rules
themselves are in `globals.css`.

- **The hero** appears without JavaScript (`hero-*` and `.line-mask`), on first paint.
- **Reveal on scroll** — `Reveal` and `Seen`: an observer marks the element once (`data-seen`), and
  a transition does the rest. Headings (`LineReveal`) slide out line by line from under masks; the
  lines are known in advance — the line breaks in the mockup are placed by hand — so nothing is
  measured or split in the browser.
- **The arc with a dot** (`components/ui/Arc.tsx`) draws itself from the tail to the dot when it
  appears on screen. It is all rotations: the stroke is a circular arc revealed by a rotating mask,
  and the dot travels along the same circle at its tip.
- **The hero image** does not float or follow the cursor: move it, and it would come off its base.
  `Stand` rotates the image in depth around the line it stands on — the line itself stays still. On
  desktop the image turns towards the cursor; at rest it stands as in the mockup.
- **Cards** tilt slightly towards the cursor (up to 2°), and a highlight glides under it (`Tilt`).
  The images and light inside the cards stay still.
- **The background does not move on scroll:** the light streak and the hero light stay where the
  mockup places them. On desktop the mockup clips the streak with a mask (`mask` on `Streak`); when
  the streak shifted on scroll, it ran into the straight edge of the mask.
- **The page does not move on its own.** Glows, the light streak and images stay as in the mockup;
  the only motion is reveals and whatever follows the cursor. Any infinite loop — a light that used
  to breathe in a card, a glow that drifted behind it — made the browser repaint the page sixty
  times a second and re-blur the glass above it, even when nobody was touching it. Now the page at
  rest draws not a single frame. The only loop is the light in the open menu, on a solid background
  and only while the menu is open.
- **Scrolling.** Lenis gives the wheel its inertia — only with a mouse: on touchscreens and on weak
  devices the library is not even downloaded. Following a link or going Back stops the inertia
  (`stopInertiaOnNavigate`): otherwise the new page kept scrolling to where the old one was heading.
  Nothing tracks scrolling frame by frame: the header and the statistics read the position ten
  times a second (`followScroll` in `src/lib/scroll.ts`). A scroll listener, even an empty one,
  makes the browser recompute all running animations on every scroll step.
  The page does not bounce at the edges (`overscroll-behavior-y: none` on `html`): on the phone the
  white footer came away from the bottom of the screen and the dark background showed through below
  it.
- **The address bar on the phone does not hide.** The browser hides it while the document scrolls,
  so on touchscreens (`pointer: coarse`) it is not the document that scrolls but the `#page` block
  (`app/layout.tsx`, styles at the end of `globals.css`); the document is exactly the size of the
  screen and stays put. `body` clips its content — otherwise Chrome would take the full-screen block
  for the document itself and hide the bar again. On desktop `#page` is an ordinary block, and
  everything works as before.
  - Unlike the document, a block's position is not restored by the browser itself: the position of
    each page is remembered by `ScrollMemory` (`components/layout`), which also restores it on Back
    and Forward; on reload a script in `app/layout.tsx` restores it, before first paint.
  - Read the position through `scrollPosition()` from `src/lib/scroll.ts`, not `window.scrollY`: on
    the phone the latter is always 0. For the same reason the reveal observer (`whenSeen`) uses
    `#page` as its root and puts the end-of-page marker at the end of it.
  - Without the bounce there is no pull-to-refresh either.
- Accordions, dropdowns and the menu are CSS transitions (`components/ui/Collapse.tsx`).
- With `prefers-reduced-motion`, animation and inertial scrolling are turned off.

#### Weak devices

What costs these pages the most is not the CPU but the GPU: on scroll it re-blurs the background
under every glass card on screen. So there is a lightweight mode — the `data-lite` attribute on
`<html>`:

- the glass is transparent, with no blur or refraction (on the phone the blur in the mockup is
  1.66px, so the difference is barely visible);
- cards do not tilt (the highlight under the cursor stays), and there is no inertial scrolling.

Reveals, arcs and the rotation of the hero image work as usual.

The mode turns on by itself, in two ways. Before first paint — through a script in
`src/app/layout.tsx`, if the device itself reports that it is weak: data saver is on, it has 2 GB of
memory or less, or up to 4 GB on a phone or with four cores or fewer. And later — through
`FrameWatch`: during the first seconds after load and while scrolling it counts frames, and if a
quarter of them take longer than 34 ms in two measurements in a row, it turns on `data-lite`. For a
device that has passed three measurements in a row, measuring stops: while it is counting, the page
builds a frame on every screen refresh.

To check manually: throttle the CPU in the developer tools (CPU throttling) or run
`document.documentElement.setAttribute("data-lite", "")` in the console.

### Glass

Cards blur the background (`backdrop-filter`), and in Chromium on screens from 768px they also
refract it at the edges — an SVG filter with a displacement map (`components/ui/GlassFilter.tsx`).
Safari and Firefox cannot do this; there, and on phones, ordinary frosted glass remains. On weak
devices the glass is transparent — see [Weak devices](#weak-devices).

The blur strength is the `--glass-blur` variable: it is the Frost of the Glass effect from the
mockup multiplied by 0.415. On the phone all cards have Frost 4 (1.66), on desktop 14 (5.8), 28
(11.6) or 9.16 (3.8). The arc's stroke is glass too: the background under it is blurred by a tenth
of the arc's width.

The light on the rim and the thickness of the glass are taken from the mockup renders — the numbers
are in `globals.css` next to `glass`:

- **Rim** — a 1px white line. The light falls from the top left: the top and left sides are at 27%,
  the right and bottom at 18%; the line is brighter in the corner facing the light and in the
  opposite one, and in the other two corners there is no line. Each side and each corner is set
  separately (`--rim-*`), so the brightness does not depend on the card's proportions. The line lies
  under the content: the card's light and images cover it, as in the mockup.
- **Thickness** — along the two lit sides the glass is slightly darker inside, along the other two
  slightly lighter; the transition extends inwards by `--pane-depth`.
- **Mirrored panes** (`glass-mirrored`) — the nomination windows and the sign-in fields: in the
  mockup they are mirrored, their light comes from the bottom left, and on desktop the glass is
  deeper — the line is brighter, with a thin second one inside.
- **The nomination window header** (`glass-head`) is a separate pane in the mockup; its rim at the
  top and sides coincides with the window's rim, so only the bottom is drawn. In a collapsed window
  the header is the whole window — there is no second line. There are six nominations, each with
  its own window; when the page opens, all of them are closed.
- A card with its own corner radius needs `--pane-r`: the rim's corners are built from it.

## Applications

All work with applications on the site side is in `src/lib/applications.ts`. The browser calls the
site's own `/api/...`, and the route `src/app/api/[...path]/route.ts` forwards the request to the
panel, at `<API_URL>/api/public/...`. The panel does not need to be exposed to the outside for
this. The route streams photos through; the other requests — small JSON — it reads in full.

`API_URL` is an environment variable of the site, read at request time. It defaults to
`http://127.0.0.1:3001` (the panel's dev server); in Docker it is set by `docker-compose.yml`, on
the server by the settings file (see [Deployment](#deployment)).

- **The first application opens the personal account.** In the form, below the phone number, there
  is a «Пароль» (Password) field (at least 8 characters): with the first application the panel
  creates an account for the email and phone number from it and sets a cookie in the browser. The
  second application and edits do not ask for the password. From another browser, participants sign
  in at `/account` — with their phone number or email and password (`signIn()`). An email or phone
  number that already has an account cannot open a new one: the form offers to sign in instead.
- **Without a password the account stays closed.** A cookie alone is not enough: to a participant
  who applied before passwords were introduced, the server does not return applications. On
  `/account` they see the «Придумайте пароль» screen (`createPassword()`), and the account opens
  once the password is set — for the email and phone number of their first application.
  Alternatively, their next application sets the password, as for a new participant.
- **What the account lacks:** sign-out and password recovery — the mockups have no such screens.
- **The form is saved in two steps:** first the text, then the photos — each in a separate request.
  If a photo fails to upload, the application is already saved; submitting the form again sends
  only what is missing.
- **Avito ID** is nine digits; the field accepts digits only. Applications submitted earlier contain
  a profile link instead of the ID — when such an application is edited, the form asks for the ID.
- **Three consents** — to the processing of personal data, to the terms of participation and to the
  publication of the work — are all mandatory.
- **The validation rules** of the form are duplicated on the server (`admin/src/lib/validation.ts`),
  as is the list of nominations. When changing them here, change them there too.
- **Statuses.** An application under moderation and a rejected one are shown in the personal
  account as in the mockup. The mockup has no «заявка принята» (application accepted) state — its
  text is written after the pattern of the other two (`copyFor` in
  `src/components/account/AccountView.tsx`); show it to the designer. The same goes for the
  messages «приём заявок завершён» (applications are closed) and «не получилось загрузить заявки»
  (could not load applications).

## Visit statistics

The site counts its own visits and passes them to the panel — the same way as applications:
`/api/activity` → `<API_URL>/api/public/activity`. There are no third-party counters. What the panel
does with them is described in [admin/README.md](../admin/README.md#site-statistics).

Everything on the site side is in `src/lib/analytics.ts`, mounted once in `src/app/layout.tsx` by
the `Tracker` component. Every page view, click on a link or button, scroll depth and time on page
is recorded automatically. UTM tags are taken from the URL the visitor arrived with.

- **A new event** is a call to `track()`. That is how the form reports its steps: the first input,
  pressing «Отправить» (Submit), fields that failed validation
  (`src/components/apply/ApplyForm.tsx`). The list of event types is shared with the panel: when
  adding a type here, add it to `admin/src/lib/analytics/types.ts` as well.
- **The click label** is the button's text or its `aria-label`. If something from the visitor can
  end up in them (a file name, for example), set the label yourself with the `data-track`
  attribute — as on the «Убрать фото» (Remove photo) button.
- **What is typed into the form is neither read nor sent** — only the names of fields with errors.
- If the panel is unavailable or the script is blocked, the site works as usual: statistics are
  simply not recorded.

## Deployment

The site lives at `https://znak-masterstva.avito.com` (the former domain now redirects permanently
(301) to the same page of the new one) and is deployed together with the panel, with a single
command from the repository root:

```bash
DEPLOY_HOST=root@<server> deploy/deploy.sh                             # site and panel
DEPLOY_HOST=root@<server> DEPLOY_SERVICES=frontend deploy/deploy.sh    # site only
```

On the server the site runs in a Docker container (`Dockerfile` in this folder) behind Traefik,
which issues the certificate and routes the site's domain to this container. How this is set up and
what is stored on the server is described in the [root README](../README.md#deployment).

The site takes the panel's address from the `API_URL` variable; in `docker-compose.yml` this is the
internal address of the panel container, which is not visible from outside.

## Before launch

- **Old applications.** Applications that visitors managed to "submit" in the first version of the
  site stayed only in their browsers and never reached the panel.
- **Contest rules.** `TERMS_URL` in `src/content/home.ts` is empty until the rules are approved:
  «здесь» (here) in the FAQ and «условия участия» (terms of participation) in the form's second
  consent are plain text. Fill in the URL and they become links that open in a new tab. The privacy
  policy (`PRIVACY_URL`) is a real link: in the form and in the footer.
- **Support address** `SUPPORT_EMAIL` in `src/components/account/AccountView.tsx` — for now it is
  the address from the mockup.
- **The mockups differ in wording.** Dates and stages now match, but some texts are worded
  differently on the phone and on desktop, and each layout follows its own mockup. One variant needs
  to be chosen:
  - «О конкурсе»: the participant chooses «до двух номинаций» (up to two nominations) on the phone
    and «две номинации» (two nominations) on desktop;
  - the home page, the «Рейтинг» (Rating) card, and the intro paragraph of «О рейтинге»: «на основе
    данных о более чем 2 миллионах…» (based on data on more than 2 million…) and «из более чем
    2 миллионов…» (out of more than 2 million…);
  - FAQ: «Когда объявят результаты?» (When will the results be announced?) and «Что получат
    исполнители рейтинга?» (What will the providers in the rating get?) — «их профили» (their
    profiles) and «их профиль» (their profile);
  - «О рейтинге»: the text of the first stage, the order and wording of the criteria;
  - the texts of the five nominations, the caption of the «Церемония награждения» (Award ceremony)
    prize and the title of the statuette in the list of awards.
- **Password in the form and the account.** The form mockup has no «Пароль» field — it was added
  below the phone number so that the «Вход» (Sign in) screen from the mockup has something to sign
  in with. The «Придумайте пароль» screen (`/account?demo=4`) is not in the mockups either: it is
  built after the pattern of «Вход», and its text is ours — show it to the designer. Sign-out and
  password recovery are not in the mockups, and the site does not have them either (see
  [Applications](#applications)).
- **The award name in the form.** In the form mockup the award is called «Звезда услуг» (Star of
  Services); on the site it is «Знак мастерства» (Znak Masterstva), as everywhere else.
- **Cookie notice.** For statistics the site sets the `znak_visitor` cookie for each visitor. The
  mockups have no cookie notice — the text and design have to come from a lawyer and the designer.

## A dev server quirk

If an edit in `globals.css` did not take effect (most often a new `@utility` or a token in
`@theme`), restart `npm run dev`: in dev mode Turbopack does not always pick up style changes on the
fly. The production build is not affected.
