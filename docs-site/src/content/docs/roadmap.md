---
title: Roadmap
description: What Oyla does today and the features that are open for contributions.
---

Oyla v0.1 covers the core: four question types, live results, English and Turkish, no accounts and
one container. Everything below is open for contributions and marked "help wanted".

Before you start on something big, comment on the matching issue or open one, so work isn't
duplicated and the approach can be agreed early. [Contributing](/oyla/development/contributing/)
explains the setup.

## Help wanted

### New question types

- **Quiz.** Timed questions with a correct answer, points per participant and a leaderboard. The
  shared `toPublicConfig` hook already exists so the correct answer can stay hidden from phones.
- **Audience Q&A with upvotes.** Participants ask questions and vote for each other's, and the
  presenter sees the most popular ones first.
- **Multi-statement scales.** Rate several statements in one question, with an average per
  statement.

[Adding a question type](/oyla/development/adding-a-question-type/) walks through the code.

### Presenting

- **Results on phones.** Show participants the results after they answer.
- **Hide results until voting ends.** Collect answers first, then reveal them on the screen.
- **Moderation of open answers.** Let the presenter hide an entry from the screen, for open
  questions and word clouds.
- **Drag-and-drop reordering** of questions in the editor, next to the Move up and Move down
  buttons.
- **CSV export** of the results.

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
