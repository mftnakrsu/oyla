# Contributing to Oyla

Thanks for helping. Oyla is a small project on purpose: one process, one database file, no
external services. Changes that keep it that way are the easiest to accept.

## Setting up

You need Node.js 24 (`nvm use` reads `.nvmrc`).

```bash
npm install
npm run dev
```

- Web app with hot reload: <http://localhost:5173>
- API and Socket.IO: <http://localhost:3000> (Vite proxies `/api` and `/socket.io` to it)
- Data goes to `./data/oyla.db`; delete the folder to start fresh.

## Before you open a pull request

```bash
npm run lint         # Biome; `npm run format` fixes formatting
npm run typecheck
npm test
npm run build && npm run e2e   # when you changed the UI or the live flow
```

CI runs the same checks.

- Keep pull requests focused: one feature or fix per PR.
- Add or update tests with your change. Server rules are tested in
  `packages/server/src/*.test.ts`, the live protocol in `packages/server/src/live/live.test.ts`,
  UI forms in `packages/web/src/question-types/respond.test.tsx`.
- Every UI string goes into `packages/web/src/i18n/en.ts` **and** `tr.ts`. If you don't speak
  Turkish, add your best guess and say so in the PR; a reviewer will fix it.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
  (`feat:`, `fix:`, `docs:`…).

## Project layout

| Path | What lives there |
|---|---|
| `packages/shared` | zod schemas, REST types, Socket.IO event types, question-type definitions |
| `packages/server` | Fastify API, Socket.IO live layer, SQLite store, retention job |
| `packages/web` | React app: pages, question-type UIs, i18n |
| `e2e` | Playwright end-to-end test |
| `docs-site` | Documentation site (Astro Starlight, separate `npm install`) |
| `video` | Demo video (Remotion, separate `npm install`) |
| `scripts` | Screenshot capture for the docs |

## Adding a question type

This is the best first contribution. A question type has two halves:

1. **`packages/shared/src/question-types/<type>.ts`:** a `defineQuestionType({...})` with the
   config schema, default config, response schema, answers per person and an `aggregate`
   function that turns answers into results. Use `textField()` from `shared/src/text.ts` for any
   text people type. Register it in `registry.ts` and export it from `packages/shared/src/index.ts`.
2. **`packages/web/src/question-types/<type>/`:** `Editor.tsx` (the presenter's settings),
   `Respond.tsx` (the phone form) and `Results.tsx` (the presenter screen). Add an icon to
   `icons.tsx` and an entry to the web `registry.ts` (Editor and Results are loaded lazily, as the
   other entries show). TypeScript reports an error until both registries list the type.
3. **Labels:** `type.<type>.label` and `type.<type>.description`, plus any strings your
   components use, in both `packages/web/src/i18n/en.ts` and `tr.ts`.
4. **Tests:** schemas and `aggregate` in `packages/shared/src/question-types/<type>.test.ts`, and
   your `Respond` form in `packages/web/src/question-types/respond.test.tsx`.

The step-by-step guide with code is in the docs:
[Adding a question type](https://oyla.mefby.com/development/adding-a-question-type/).

## Reporting bugs and ideas

Open an issue with the matching template. For security problems, follow
[SECURITY.md](SECURITY.md) instead of opening a public issue.

By contributing you agree that your work is released under the [MIT License](LICENSE) and that
you follow the [Code of Conduct](CODE_OF_CONDUCT.md).
