---
title: Presenting
description: Create a presentation, add questions, keep the admin link and run the presenter screen.
---

This page walks through a session from the presenter's side: create a presentation, add
questions, put the presenter screen on the projector and move through the questions while the
audience answers.

## Create a presentation

1. Open the Oyla start page, for example `https://oyla.mefby.com` or your own instance.
2. Under **Run a session**, select **Create presentation**.
3. Enter a name (up to 120 characters) and select **Create presentation**.

If the server owner set a create password, the form also asks for a **Server password**. Joining
and answering never need a password; it only protects creating presentations.

<img
  class="shot"
  src="/oyla/screenshots/home-en-light.png"
  alt="The start page with a large join code field on the left and a Run a session panel with a Create presentation button on the right"
  width="2160"
  height="1350"
  loading="lazy"
/>

## Keep the admin link

There are no accounts. Creating a presentation gives you an **admin link** that looks like this:

```text
https://oyla.example.com/edit/AbC123xYz789#key=…
```

The editor shows it once in a **Keep this link** box. Select **Copy admin link**, store it
somewhere safe, then select **I saved it**.

- The admin link is the only way back into the presentation. Anyone who has it can edit, present
  and delete it, so share it only with co-presenters.
- Your browser also remembers the presentation under **Your presentations** on the start page,
  with **Open** and **Present** buttons. That list lives in this browser only.
- You can copy the link again any time with **Copy admin link** at the bottom of the editor.

:::caution
If you lose the admin link and clear your browser storage, nobody can recover it. The server only
stores a hash of the secret part.
:::

## Add questions

<img
  class="shot"
  src="/oyla/screenshots/editor-en-light.png"
  alt="The editor: a list of four questions on the left and the selected multiple-choice question with its four options on the right"
  width="2160"
  height="1350"
  loading="lazy"
/>

1. Select **Add question** and pick a type under **Choose a question type**: multiple choice,
   word cloud, open question or scale. See [Question types](/oyla/guide/question-types/) for what
   each one does.
2. Type your question in the **Question** field (up to 200 characters).
3. Fill in the settings of that type, such as the options of a multiple-choice question.

Changes save on their own shortly after you stop typing; the editor shows **Saving…** and then
**Saved**. Other things you can do in the editor:

- Rename the presentation by clicking its name in the header.
- Reorder questions with the **Move up** and **Move down** arrows.
- Remove a question with **Delete question**. The button asks you to click again to confirm.
- See how many answers a question has (for example, "3 answers so far") and clear them with
  **Reset results**.

A presentation can have up to 50 questions.

<img
  class="shot"
  src="/oyla/screenshots/editor-types-en-light.png"
  alt="The question type picker with four cards: Multiple choice, Word cloud, Open question and Scale"
  width="2160"
  height="1350"
  loading="lazy"
/>

## Present

Select **Present** in the editor header (it is available once the presentation has a question).
The presenter screen opens and, if no question is active yet, starts with the first one. Put this
window on the projector.

<img
  class="shot"
  src="/oyla/screenshots/present-mc-en-light.png"
  alt="The presenter screen with 'Go to oyla.mefby.com and enter 859 847' at the top, a QR code, bar chart results and controls at the bottom"
  width="2160"
  height="1350"
  loading="lazy"
/>

- The top bar always shows **Go to _host_ and enter _code_** and a QR code, so latecomers can
  join at any point.
- The active question and its results fill the middle. Results update as answers arrive.
- The bottom bar shows how many people are connected (for example, "25 people here") and where
  you are ("1 of 4").

The buttons at the bottom right are **Previous question**, **Next question**, **Reset results**,
**Show join instructions**, **Full screen** and **Back to editor**.

### Keyboard shortcuts

| Key | Action |
|---|---|
| <kbd>→</kbd>, <kbd>Page Down</kbd> or <kbd>Space</kbd> | Next question |
| <kbd>←</kbd> or <kbd>Page Up</kbd> | Previous question |
| <kbd>F</kbd> | Full screen on and off |
| <kbd>I</kbd> | Show or hide the join instructions |
| <kbd>Esc</kbd> | Hide the join instructions |

Most presentation clickers send Page Up and Page Down, so they work too.

### Join instructions

Press <kbd>I</kbd>, click the QR code in the top bar or select **Show join instructions** to show
the host, the join code and a large QR code across the whole screen. This is a good first slide
while people find their seats. **Hide join instructions** or <kbd>Esc</kbd> closes it.

<img
  class="shot"
  src="/oyla/screenshots/present-invite-en-light.png"
  alt="Full-screen join instructions: 'Go to oyla.mefby.com', the code 859 847 in very large digits and a QR code"
  width="2160"
  height="1350"
  loading="lazy"
/>

## Reset results

**Reset results** on the presenter screen deletes every answer to the active question; the button
of the same name in the editor does it for the selected question. Phones that had answered get the
form back and can answer again. Use it after a test run.

:::caution
Reset results takes effect at the first click and cannot be undone.
:::

## Change questions during a session

You can keep the editor open in another tab or window while presenting.

- Editing a question never deletes its answers. If you change the active question, phones get the
  new version right away.
- Renaming or adding multiple-choice options keeps the existing votes. Votes for an option you
  remove no longer count.
- If you change the range of a scale, ratings outside the new range no longer count.

## Leave and come back

Closing the presenter screen does not stop the session. The active question stays active and
phones keep showing it, so you can switch to slides and come back. The server stores the active
question, so a server restart resumes at the same place.

To present from another computer, open the admin link there and select **Present**.

## Delete a presentation

Select **Delete presentation** at the bottom of the editor and click again to confirm. This
removes the presentation, its questions and all answers. Connected phones see **This presentation
has ended**.

Servers also delete presentations nobody has used for a while: 30 days by default. Opening,
editing or presenting a presentation, and people joining or answering, all count as use. See
[`OYLA_RETENTION_DAYS`](/oyla/self-hosting/configuration/#oyla_retention_days).
