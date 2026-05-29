# agridesk-web

Next.js 16 (App Router) + TypeScript frontend for AgriDesk. Hindi-first UI
with English toggle, talks to `agridesk-api` over a custom client-side
session.

> See [the root README](../README.md) for product context.

## Stack

- **Next.js 16** App Router, all dashboard routes are client components
- **TypeScript** strict mode
- **Tailwind 4** + **shadcn/ui** (built on Base UI primitives)
- **Sonner** for toasts
- **lucide-react** icons
- **jsPDF** for client-side bill PDFs
- **Playwright** for UI tests
- Custom **localStorage** session (`agridesk.session`) + custom **`api` client**
  in `src/lib/api.ts`

## Quickstart

```bash
npm install
npm run dev -- -p 5501
```

Boots on `http://127.0.0.1:5501`. The Playwright config + e2e script both
assume port **5501** — keep that consistent unless you're changing the
whole stack.

Backend must be running on `http://127.0.0.1:8080` (see `../agridesk-api`).

## Environment variables

Defaults in `src/lib/api.ts` point at local dev. To target a deployed
backend, create `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://agridesk-api.onrender.com
```

That's the only variable the frontend needs.

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server (hot reload) |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run test:ui` | Playwright UI suite (24 tests, ~3.4 min, headless Chromium) |
| `npm run test:ui:headed` | Same, but with a visible browser window |
| `npm run test:ui:report` | Open the last HTML report |

## Project layout

```
src/
├── app/
│   ├── (auth)/                login/, signup/
│   ├── (dashboard)/
│   │   ├── layout.tsx         sidebar + mobile nav + trial banner; session guard
│   │   └── dashboard/
│   │       ├── page.tsx       overview (metric cards, top debtors, recent bills)
│   │       ├── farmers/       CRUD with search
│   │       ├── ledger/        credit + payment + filters + WhatsApp reminders
│   │       ├── inventory/     products + stock batches + expiry alerts
│   │       ├── billing/       bill creation flow, PDF download, WhatsApp share
│   │       ├── settings/      dealer details, staff, language toggle
│   │       └── upgrade/       Razorpay checkout
│   ├── layout.tsx             global providers
│   └── page.tsx               root redirect
├── components/
│   ├── ui/                    shadcn-style primitives (Button, Card, Dialog, ...)
│   ├── dashboard/             Sidebar, MobileNav, TrialBanner
│   └── delete-confirm.tsx     AlertDialog wrapper
└── lib/
    ├── api.ts                 typed fetch client (auto-attaches JWT, redirects on 401)
    ├── session.ts             localStorage 'agridesk.session' helpers
    ├── subscription.ts        trial-status computation
    └── utils.ts               cn() helper
```

## Tests

```bash
# Run the suite (needs the backend at :8080 and this frontend at :5501)
npm run test:ui
```

Each test creates its own dealer via `POST /api/auth/signup` so they don't
collide. Sequential by design (1 worker) because tests share the persistent
H2 file on the backend.

Latest clean run: **24 passed, ~3.4 min** on Chromium.

See [`tests-e2e/`](tests-e2e/) for the full suite. The test catalog is
documented in [`../docs/HLD.md` §14.1](../docs/HLD.md).

## i18n

The current implementation uses **inline Hindi + English strings** in
components rather than a runtime i18n library. Each label appears as
`हिंदी / English`. The user's preferred language is persisted on the
dealer record; the sidebar honours it.

A `next-intl` migration is on the roadmap once the dashboard stabilizes.

## Build

```bash
npm run build
npm start                       # production server on :3000 by default
```

For Vercel: just push to GitHub and import the repo. Set `NEXT_PUBLIC_API_URL`
in Vercel project settings to your deployed backend URL.
