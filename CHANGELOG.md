# Changelog

All notable changes to Oyla. The format follows [Keep a Changelog](https://keepachangelog.com/),
and versions follow [Semantic Versioning](https://semver.org/).

## Unreleased

### Added

- **Q&A question type:** participants ask questions and upvote each other's; the presenter
  screen lists them most upvoted first. Each person upvotes a question once and not their own.
  Every phone sees the live list, and moderation hides a question with its upvotes.

### Changed

- Question types gain three optional hooks for reactions: `isAnswer`, `allows` and
  `sharedOnPhones`. `ParticipantState` gains `mine`, and `RespondProps` gains `results` and
  `mine`, for types that use them.

## 0.2.0 - 2026-11-07

Presenter tools: everything in the roadmap's "Presenting" group.

### Added

- **Download results as CSV** from the editor: one row per answer, with numbered participants
  (participant ids never leave the server) and headers in the interface language. Cells that
  look like spreadsheet formulas are defused. ([#1])
- **Drag-and-drop ordering** of questions in the editor list, next to the Move up / Move down
  buttons. ([#2])
- **Hide results until you reveal them**, per question: a checkbox in the editor, or the eye
  button / <kbd>H</kbd> on the presenter screen. The screen shows the answer count meanwhile. ([#3])
- **Moderation** for word clouds and open questions: <kbd>M</kbd> or the shield button, then ✕
  takes an answer off the screen. Hiding works on the text, so the same answer sent again stays
  hidden. ([#4])
- **Results on phones**, an optional presentation setting: each phone shows the live chart after
  it has answered. The server decides who gets results, and hidden or moderated answers stay
  hidden. ([#5])

### Changed

- Question types gain a required `describeResponse` (used by the CSV export) and an optional
  `moderationKey`. See [Adding a question type](https://oyla.mefby.com/development/adding-a-question-type/).
- Database migrations `0002` to `0004` add `questions.results_hidden`, `questions.hidden_keys` and
  `presentations.results_on_phones`. They run on startup; existing presentations keep working.

### Fixed

- Multiple-choice and scale results no longer overflow above the visible area when there is more
  content than space (many options on a small screen, or on a phone).

## 0.1.0 - 2026-10-18

First public release: multiple choice, word cloud, open question and scale; live results over
Socket.IO; four colour themes; English and Turkish; no accounts; one Docker container with SQLite.

[#1]: https://github.com/mftnakrsu/oyla/pull/1
[#2]: https://github.com/mftnakrsu/oyla/pull/2
[#3]: https://github.com/mftnakrsu/oyla/pull/3
[#4]: https://github.com/mftnakrsu/oyla/pull/4
[#5]: https://github.com/mftnakrsu/oyla/pull/5
