---
title: Question types
description: Multiple choice, word cloud, open question and scale, with their settings, limits and results.
---

Oyla has four question types. Every question has a title of up to 200 characters; the settings
below depend on the type. You pick the type when you add a question and can't change it later, so
delete the question and add a new one if you need a different type.

| Type | Answers per person | Results on the screen |
|---|---|---|
| [Multiple choice](#multiple-choice) | 1 | Bars with percentages and vote counts |
| [Word cloud](#word-cloud) | 1 to 5 (default 3) | Words that grow with the number of people who gave them |
| [Open question](#open-question) | 1 to 5 (default 1) | Answers as notes, newest first |
| [Scale](#scale) | 1 | Average and a column chart of the ratings |

## Multiple choice

Everyone picks one option.

<div class="screens">
  <img
    class="shot"
    src="/oyla/screenshots/present-mc-en-light.png"
    alt="Multiple-choice results: four horizontal bars labelled Offline mode 38%, Dark mode 25%, CSV export 13% and Team spaces 25%, 24 votes"
    width="2160"
    height="1350"
    loading="lazy"
  />
  <img
    class="shot phone"
    src="/oyla/screenshots/phone-mc-en-light.png"
    alt="The phone form: four options to pick from and a Send vote button"
    width="1170"
    height="1992"
    loading="lazy"
  />
</div>

**Settings:** 2 to 10 **Options**, each up to 80 characters. Use **Add option** and the × next to
an option to change the list. An option left empty shows as "Option 1", "Option 2" and so on.

**Results:** one bar per option with its share in percent and the number of votes, plus the total.
All bars use one colour, and every bar carries its label, so the chart reads well for colour-blind
viewers and on washed-out projectors.

Each option keeps a stable internal id. Renaming an option or adding new ones keeps the votes
already given; votes for a removed option stop counting.

## Word cloud

Participants send short answers. The more people give the same answer, the bigger it gets.

<div class="screens">
  <img
    class="shot"
    src="/oyla/screenshots/present-cloud-en-light.png"
    alt="A word cloud with momentum and growth in the largest type and smaller words such as learning, shipping and chaotic around them"
    width="2160"
    height="1350"
    loading="lazy"
  />
  <img
    class="shot phone"
    src="/oyla/screenshots/phone-cloud-en-light.png"
    alt="The phone form: a text field with the word momentum and a Send button"
    width="1170"
    height="1992"
    loading="lazy"
  />
</div>

**Settings:** **Answers per person**, from 1 to 5 (default 3).

**Answers:** 1 to 25 characters. Leading and trailing spaces are removed and runs of spaces become
one.

**Results:** the 100 most common answers. Answers are grouped without regard to upper and lower
case, so "Pizza" and "pizza" count as one word; the screen shows the spelling that arrived first.

## Open question

Participants write free text, and the answers appear as notes on the screen.

<div class="screens">
  <img
    class="shot"
    src="/oyla/screenshots/present-open-en-light.png"
    alt="Open answers shown as paper notes in three columns, such as 'Demo every Friday, it keeps us honest' and 'Short standups'"
    width="2160"
    height="1350"
    loading="lazy"
  />
  <img
    class="shot phone"
    src="/oyla/screenshots/phone-open-en-light.png"
    alt="The phone form: a text area with an answer, a characters-left counter and a Send button"
    width="1170"
    height="1992"
    loading="lazy"
  />
</div>

**Settings:** **Answers per person**, from 1 to 5 (default 1).

**Answers:** up to 280 characters. Line breaks are kept.

**Results:** the latest 200 answers, newest first, and the total number of answers. There is no
moderation yet: every answer appears on the screen as soon as it arrives. Keep that in mind with a
large or unknown audience.

## Scale

People rate a statement from low to high.

<div class="screens">
  <img
    class="shot"
    src="/oyla/screenshots/present-scale-en-light.png"
    alt="Scale results: an average of 3.8 next to five columns for the ratings 1 to 5, labelled Not ready and Fully ready"
    width="2160"
    height="1350"
    loading="lazy"
  />
  <img
    class="shot phone"
    src="/oyla/screenshots/phone-scale-en-light.png"
    alt="The phone form: number buttons from 1 to 5 with 4 selected, the labels Not ready and Fully ready, and a Send rating button"
    width="1170"
    height="1992"
    loading="lazy"
  />
</div>

**Settings:**

- **From**: 0 or 1 (default 1).
- **To**: 2 to 10 (default 5).
- **Label for the lowest value** and **Label for the highest value**: optional, up to 40
  characters each, for example "Not at all" and "Completely".

**Results:** the average with one decimal, the number of answers, and a column per value showing
how many people picked it. If you change the range after people answered, ratings outside the new
range stop counting.

## Limits for every type

| Limit | Value |
|---|---|
| Presentation name | 120 characters |
| Question title | 200 characters |
| Questions per presentation | 50 |
| Answers per question, all participants together | 2,000 |

## Missing a type?

Quizzes, audience Q&A with upvotes and multi-statement scales are on the
[roadmap](/oyla/roadmap/). If you want to build one, start with
[Adding a question type](/oyla/development/adding-a-question-type/).
