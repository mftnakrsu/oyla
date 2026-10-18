#!/usr/bin/env node
/**
 * Captures the screenshots used by the README, the docs site and the demo video.
 *
 *   npm run build && PORT=3100 OYLA_DB_PATH=:memory: npm start   # in one terminal
 *   node scripts/capture-screenshots.mjs [outDir]                 # in another
 *
 * The browser maps oyla.example.com to the local server so the screens show a plausible address
 * of a self-hosted server.
 * Simulated participants vote over Socket.IO directly, which is far lighter than one browser
 * per phone.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, devices } from '@playwright/test';
import { io } from 'socket.io-client';

const server = process.env.OYLA_URL ?? 'http://127.0.0.1:3100';
const host = 'oyla.example.com';
const base = `http://${host}`;
const outDir = process.argv[2] ?? 'docs/media/screenshots';
const { port } = new URL(server);
mkdirSync(outDir, { recursive: true });

const decks = {
  en: {
    title: 'Product all-hands',
    questions: [
      {
        type: 'multiple-choice',
        title: 'Which feature should we build next?',
        options: ['Offline mode', 'Dark mode', 'CSV export', 'Team spaces'],
        votes: [9, 6, 3, 6],
      },
      {
        type: 'word-cloud',
        title: 'Describe this quarter in one word',
        config: { maxEntries: 3 },
        words: {
          momentum: 7,
          growth: 5,
          chaotic: 3,
          learning: 4,
          intense: 2,
          exciting: 3,
          focused: 2,
          rewarding: 2,
          busy: 1,
          teamwork: 2,
          fun: 1,
          ambitious: 1,
          shipping: 3,
        },
      },
      {
        type: 'scale',
        title: 'How ready do you feel for the launch?',
        config: { min: 1, max: 5, minLabel: 'Not ready', maxLabel: 'Fully ready' },
        ratings: [1, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5],
      },
      {
        type: 'open-ended',
        title: 'What is one thing we should keep doing?',
        answers: [
          'Demo every Friday, it keeps us honest',
          'Pairing on the tricky bugs',
          'Short standups',
          'Writing the docs together with the code',
          'Celebrating small wins in the channel',
          'Customer calls with the whole team once a month',
          'No-meeting Wednesdays',
          'Saying no to scope creep early',
        ],
      },
    ],
  },
  tr: {
    title: 'Ürün ekibi toplantısı',
    questions: [
      {
        type: 'multiple-choice',
        title: 'Sırada hangi özelliği geliştirelim?',
        options: ['Çevrimdışı mod', 'Karanlık mod', 'CSV dışa aktarma', 'Takım alanları'],
        votes: [8, 7, 2, 5],
      },
      {
        type: 'word-cloud',
        title: 'Bu çeyreği tek kelimeyle anlatın',
        config: { maxEntries: 3 },
        words: {
          ivme: 6,
          büyüme: 5,
          yoğun: 4,
          öğretici: 4,
          heyecanlı: 3,
          odaklı: 2,
          keyifli: 2,
          takım: 2,
          hızlı: 1,
          zorlu: 2,
          verimli: 1,
        },
      },
      {
        type: 'scale',
        title: 'Lansmana ne kadar hazır hissediyorsunuz?',
        config: { min: 1, max: 5, minLabel: 'Hiç hazır değil', maxLabel: 'Tamamen hazır' },
        ratings: [2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 4, 3, 4, 5],
      },
      {
        type: 'open-ended',
        title: 'Neyi yapmaya devam etmeliyiz?',
        answers: [
          'Her cuma demo',
          'Zor hatalarda eşli çalışma',
          'Kısa toplantılar',
          'Küçük başarıları kutlamak',
          'Dokümantasyonu kodla birlikte yazmak',
          'Çarşamba günleri toplantısız gün',
        ],
      },
    ],
  },
};

async function rest(method, path, token, body) {
  const response = await fetch(`${server}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok)
    throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

/** Creates a presentation through the API and returns ids, token and question ids. */
async function createDeck(deck, theme) {
  const created = await rest('POST', '/presentations', null, { title: deck.title });
  if (theme) await rest('PATCH', `/presentations/${created.id}`, created.adminToken, { theme });
  const ids = [];
  for (const question of deck.questions) {
    const config =
      question.type === 'multiple-choice'
        ? { options: question.options.map((label, i) => ({ id: `o${i}`, label })) }
        : question.config;
    const added = await rest('POST', `/presentations/${created.id}/questions`, created.adminToken, {
      type: question.type,
      title: question.title,
      ...(config ? { config } : {}),
    });
    ids.push(added.id);
  }
  return { ...created, questionIds: ids };
}

/** Simulated phones: each joins once and answers whatever question is active when asked. */
async function crowd(joinCode, size) {
  const sockets = await Promise.all(
    Array.from(
      { length: size },
      (_, i) =>
        new Promise((resolve, reject) => {
          const socket = io(server, { transports: ['websocket'], forceNew: true });
          socket.on('connect', () =>
            socket.emit(
              'participant:join',
              { joinCode, participantId: `simulated-phone-${String(i).padStart(4, '0')}` },
              (ack) => (ack.ok ? resolve(socket) : reject(new Error(ack.error.code))),
            ),
          );
          socket.on('connect_error', reject);
        }),
    ),
  );
  const submit = (socket, questionId, response) =>
    new Promise((resolve) => socket.emit('response:submit', { questionId, response }, resolve));
  return {
    size: sockets.length,
    async answer(questionId, responses) {
      for (let i = 0; i < responses.length; i += 1) {
        const socket = sockets[i % sockets.length];
        await submit(socket, questionId, responses[i]);
        await new Promise((r) => setTimeout(r, 40));
      }
    },
    close() {
      for (const socket of sockets) socket.disconnect();
    },
  };
}

function responsesFor(question) {
  switch (question.type) {
    case 'multiple-choice':
      return question.votes.flatMap((n, i) =>
        Array.from({ length: n }, () => ({ optionId: `o${i}` })),
      );
    case 'word-cloud':
      return Object.entries(question.words).flatMap(([text, n]) =>
        Array.from({ length: n }, () => ({ text })),
      );
    case 'scale':
      return question.ratings.map((value) => ({ value }));
    default:
      return question.answers.map((text) => ({ text }));
  }
}

const browser = await chromium.launch({
  args: [`--host-resolver-rules=MAP ${host}:80 127.0.0.1:${port}`],
});

async function capture(language, scheme, { phoneShots = true, desktopShots = true } = {}) {
  const deck = decks[language];
  const suffix = `${language}-${scheme}`;
  const created = await createDeck(deck);
  const prefs = { 'oyla:language': JSON.stringify(language) };
  const init = (values) => {
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
  };

  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    colorScheme: scheme,
  });
  await desktop.addInitScript(init, prefs);
  const page = await desktop.newPage();

  if (desktopShots) {
    await page.goto(base);
    await page.getByRole('heading', { level: 1 }).waitFor();
    await page.screenshot({ path: join(outDir, `home-${suffix}.png`) });
    await page.goto(`${base}/edit/${created.id}#key=${created.adminToken}`);
    await page.getByRole('heading', { name: /Questions|Sorular/ }).waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, `editor-${suffix}.png`) });
    await page.getByRole('button', { name: /Add question|Soru ekle/ }).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(outDir, `editor-types-${suffix}.png`) });
  }

  await page.goto(`${base}/present/${created.id}#key=${created.adminToken}`);
  await page.getByRole('heading', { level: 1 }).waitFor();
  const people = await crowd(created.joinCode, 24);
  await page.waitForTimeout(800);

  const phoneContext = await browser.newContext({ ...devices['iPhone 13'], colorScheme: scheme });
  await phoneContext.addInitScript(init, prefs);
  const phone = await phoneContext.newPage();

  if (phoneShots) {
    await phone.goto(base);
    await phone.getByRole('heading', { level: 1 }).waitFor();
    await phone.getByRole('textbox').fill(created.joinCode);
    await phone.screenshot({ path: join(outDir, `phone-home-${suffix}.png`) });
    await phone.goto(`${base}/join/${created.joinCode}`);
  }

  const kinds = ['mc', 'cloud', 'scale', 'open'];
  for (let q = 0; q < deck.questions.length; q += 1) {
    const question = deck.questions[q];
    const questionId = created.questionIds[q];
    if (q > 0) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);
    }
    if (phoneShots) {
      await phone.getByRole('heading', { name: question.title }).waitFor();
      if (question.type === 'multiple-choice')
        await phone.getByText(question.options[0], { exact: true }).click();
      if (question.type === 'word-cloud')
        await phone.getByRole('textbox').fill(Object.keys(question.words)[0]);
      if (question.type === 'scale') await phone.locator('label', { hasText: /^4$/ }).click();
      if (question.type === 'open-ended')
        await phone.getByRole('textbox').fill(question.answers[0]);
      await phone.waitForTimeout(250);
      await phone.screenshot({ path: join(outDir, `phone-${kinds[q]}-${suffix}.png`) });
    }
    // Round-robin over 24 phones keeps everyone inside their answer allowance.
    await people.answer(questionId, responsesFor(question));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: join(outDir, `present-${kinds[q]}-${suffix}.png`) });
    if (phoneShots && q === 0) {
      await phone.getByRole('button', { name: /Send vote|Oyu gönder/ }).click();
      await phone.waitForTimeout(600);
      await phone.screenshot({ path: join(outDir, `phone-thanks-${suffix}.png`) });
    }
  }

  await page.keyboard.press('i');
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, `present-invite-${suffix}.png`) });

  people.close();
  await phoneContext.close();
  await desktop.close();
}

/** The first question of a deck in another theme: presenter screen and phone. */
async function captureTheme(theme, language) {
  const deck = { ...decks[language], questions: decks[language].questions.slice(0, 1) };
  const created = await createDeck(deck, theme);
  const prefs = { 'oyla:language': JSON.stringify(language) };
  const init = (values) => {
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
  };
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  await desktop.addInitScript(init, prefs);
  const page = await desktop.newPage();
  await page.goto(`${base}/present/${created.id}#key=${created.adminToken}`);
  await page.getByRole('heading', { level: 1 }).waitFor();
  const people = await crowd(created.joinCode, 24);
  const phoneContext = await browser.newContext({ ...devices['iPhone 13'] });
  await phoneContext.addInitScript(init, prefs);
  const phone = await phoneContext.newPage();
  await phone.goto(`${base}/join/${created.joinCode}`);
  await phone.getByRole('heading', { name: deck.questions[0].title }).waitFor();
  await phone.getByText(deck.questions[0].options[0], { exact: true }).click();
  await phone.waitForTimeout(250);
  await phone.screenshot({ path: join(outDir, `theme-${theme}-phone-${language}.png`) });
  await people.answer(created.questionIds[0], responsesFor(deck.questions[0]));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(outDir, `theme-${theme}-present-${language}.png`) });
  people.close();
  await phoneContext.close();
  await desktop.close();
}

await capture('en', 'light');
await capture('en', 'dark');
await capture('tr', 'light');
for (const theme of ['emerald', 'indigo', 'navy', 'blue']) {
  await captureTheme(theme, 'en');
  await captureTheme(theme, 'tr');
}
await browser.close();
console.log(`Screenshots written to ${outDir}`);
