---
title: Contributing
description: Set up Oyla locally, run the checks and open a pull request.
---

Thanks for helping. Oyla is small on purpose: one process, one database file, no external
services. Changes that keep it that way are the easiest to accept. The short version of this page
is in [`CONTRIBUTING.md`](https://github.com/mftnakrsu/oyla/blob/main/CONTRIBUTING.md) in the
repository.

## Set up

You need Node.js 24. With nvm, `nvm use` picks the version from `.nvmrc`.

```bash
git clone https://github.com/mftnakrsu/oyla.git
cd oyla
npm install
npm run dev
```

`npm run dev` starts two processes:

- the server on <http://localhost:3000> (API and Socket.IO, restarts when you save), and
- Vite on <http://localhost:5173> with hot reload. It proxies `/api` and `/socket.io` to the server.

Open <http://localhost:5173>. Data goes to `./data/oyla.db`; delete the `data` folder to start
fresh. To try the phone view, open a second browser window; a private window gets its own
participant id. To test with a real phone on the same Wi-Fi, run the production build
(`npm run build && npm start`), which listens on all interfaces, and open
`http://<your computer's IP>:3000` on the phone.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Installs all workspaces |
| `npm run dev` | Server on port 3000 and Vite on port 5173 |
| `npm test` | Unit and integration tests with Vitest |
| `npm run typecheck` | TypeScript for every package and the end-to-end test |
| `npm run lint` | Biome lint and format check (`npm run format` fixes formatting) |
| `npm run build` | Builds the web app and the server bundle |
| `npm start` | Runs the production build on port 3000 |
| `npm run e2e` | Playwright end-to-end test against the production build; run `npm run build` first |

The first time you run the end-to-end test, Playwright may ask you to install a browser with
`npx playwright install chromium`.

## Before you open a pull request

```bash
npm run lint
npm run typecheck
npm test
npm run build && npm run e2e   # when you changed the UI or the live flow
```

CI runs the same checks.

- Keep pull requests focused: one feature or fix each.
- Add or update tests with your change. Server rules are tested in
  `packages/server/src/*.test.ts`, the live protocol in `packages/server/src/live/live.test.ts`,
  question types in `packages/shared/src/question-types/*.test.ts` and the phone forms in
  `packages/web/src/question-types/respond.test.tsx`.
- Every UI string goes into `packages/web/src/i18n/en.ts` **and** `tr.ts`. If you don't speak
  Turkish, add your best guess and say so in the pull request; a reviewer will fix it.
- Write commit messages as [Conventional Commits](https://www.conventionalcommits.org/):
  `feat:`, `fix:`, `docs:` and so on.

## Where things are

| You want to change | Look in |
|---|---|
| A page of the web app | `packages/web/src/pages/` |
| A question type | `packages/shared/src/question-types/` and `packages/web/src/question-types/` |
| UI wording | `packages/web/src/i18n/en.ts` and `tr.ts` |
| REST routes | `packages/server/src/http/routes.ts` |
| Business rules (limits, answering, reset) | `packages/server/src/service.ts` |
| Live events | `packages/shared/src/protocol.ts` and `packages/server/src/live/` |
| Database schema | `packages/server/src/db/schema.ts`, then `npm run db:generate -w @oyla/server` for a migration |
| Environment variables | `packages/server/src/config.ts` |

The [architecture page](/oyla/development/architecture/) explains how the parts fit together.

## Good first contributions

- **A new interface language.** Add a dictionary next to `packages/web/src/i18n/en.ts` and
  register it in `I18nProvider.tsx`.
- **A new question type.** Follow [Adding a question type](/oyla/development/adding-a-question-type/).
- **Accessibility fixes** you notice while using Oyla with a keyboard or a screen reader.

Bigger features are listed on the [roadmap](/oyla/roadmap/). Comment on an issue, or open one,
before you start on something large, so work isn't duplicated.

## Documentation

This site lives in `docs-site/` and is a separate npm project:

```bash
cd docs-site
npm install
npm run dev      # http://localhost:4321/oyla/
npm run build
```

Pages are Markdown files in `docs-site/src/content/docs/`; Turkish translations sit under `tr/`.
Every page has an **Edit page** link at the bottom.

## Reporting bugs and security problems

Open an issue for bugs and ideas. For security problems, don't open a public issue; follow the
[security policy](/oyla/security/#report-a-vulnerability).

By contributing you agree that your work is released under the
[MIT License](https://github.com/mftnakrsu/oyla/blob/main/LICENSE) and that you follow the
[Code of Conduct](https://github.com/mftnakrsu/oyla/blob/main/CODE_OF_CONDUCT.md).
