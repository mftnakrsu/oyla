---
title: Roadmap
description: What Oyla does today and the features that are open for contributions.
---

Oyla covers the core: seven question types, live results, presentation themes, presenter tools
(hiding and revealing results, moderation, results on phones, CSV export, drag-and-drop ordering),
English and Turkish, no accounts and one container. Everything below is open for contributions and marked "help wanted".

Before you start on something big, comment on the matching issue or open one, so work isn't
duplicated and the approach can be agreed early. [Contributing](/development/contributing/)
explains the setup.

## Help wanted

### New question types

- **Your idea.** Open an issue that describes the question and what the screen should show.

[Adding a question type](/development/adding-a-question-type/) walks through the code.

### Platform

- **User accounts**, as an optional mode for instances that want a presentation list that follows
  people across devices.
- **Horizontal scaling.** Run several server instances behind a load balancer with the Socket.IO
  Redis adapter. Presence and results throttling live in memory today
  (`packages/server/src/live/broadcaster.ts`), and the data is in one SQLite file, so this needs
  shared state as well as the adapter.
- **More UI languages.** Add a dictionary next to `packages/web/src/i18n/en.ts`.

## Good first issues

- A new interface language.
- Small improvements to an existing question type.
- Accessibility fixes you notice while using Oyla with a keyboard or a screen reader.
- Corrections and additions to this documentation; every page has an edit link.
