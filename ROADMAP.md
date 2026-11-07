# Roadmap

Oyla covers the core: six question types, live results, presentation themes, presenter tools
(hiding and revealing results, moderation, results on phones, CSV export, drag-and-drop ordering),
no accounts, one container.
The items below are open for contributions. Comment on (or open) an issue before starting
something big, so work isn't duplicated.

## Help wanted

### New question types
- **Multi-statement scale:** rate several statements at once, show the average per statement.

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
