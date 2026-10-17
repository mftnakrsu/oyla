# Roadmap

Oyla v0.1 covers the core: four question types, live results, no accounts, one container.
The items below are open for contributions. Comment on (or open) an issue before starting
something big, so work isn't duplicated.

## Help wanted

### New question types
- **Quiz:** timed questions with a correct answer, points and a leaderboard. The shared
  `toPublicConfig` hook already exists so the correct answer can be hidden from phones.
- **Audience Q&A:** participants ask questions and upvote each other's.
- **Multi-statement scale:** rate several statements at once, show the average per statement.

### Presenting
- Hide results until voting ends, then reveal them.
- Show results on participants' phones after they answer.
- Moderation for open answers and word clouds (hide an entry from the screen).
- Drag-and-drop reordering in the editor.
- Export results as CSV.

### Platform
- **Scaling to several servers** with the Socket.IO Redis adapter (presence and throttling are
  in-memory today, see `packages/server/src/live/broadcaster.ts`).
- **User accounts** as an optional mode, for instances that want a "my presentations" list across
  devices.
- More interface languages (add a dictionary next to `packages/web/src/i18n/en.ts`).

## Good first issues

- A new language for the interface.
- Small question-type improvements, such as an optional image on a multiple-choice question.
- Accessibility improvements you notice while using it with a screen reader or keyboard.
