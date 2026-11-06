import { devices, expect, test } from '@playwright/test';

test('phones show the live results after answering when the presenter shares them', async ({
  page,
  browser,
}) => {
  await page.goto('/new');
  await page.getByLabel('Name').fill('Lunch vote');
  await page.getByRole('button', { name: 'Create presentation' }).click();
  await page.getByRole('button', { name: /Multiple choice/ }).click();
  await page.getByLabel('Question', { exact: true }).fill('Pizza or salad?');
  await page.getByRole('textbox', { name: 'Option 1' }).fill('Pizza');
  await page.getByRole('textbox', { name: 'Option 2' }).fill('Salad');
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: /Show results on phones/ }).check();
  const code =
    (await page.getByText(/Join code \d{3} \d{3}/).textContent())?.replace(/\D/g, '') ?? '';
  await page.getByRole('button', { name: 'Present', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pizza or salad?' })).toBeVisible();

  const phones = await Promise.all(
    [0, 1].map(async () => {
      const context = await browser.newContext({ ...devices['Pixel 7'] });
      const phone = await context.newPage();
      await phone.goto(`/join/${code}`);
      await expect(phone.getByRole('heading', { name: 'Pizza or salad?' })).toBeVisible();
      return { context, phone };
    }),
  );
  const [first, second] = phones;
  if (!first || !second) throw new Error('phones missing');

  await first.phone.getByText('Pizza', { exact: true }).click();
  await first.phone.getByRole('button', { name: 'Send vote' }).click();
  await expect(first.phone.getByRole('heading', { name: 'Live results' })).toBeVisible();
  await expect(first.phone.getByText('100%')).toBeVisible();
  // The second phone hasn't voted, so it still sees the question, not the results.
  await expect(second.phone.getByRole('button', { name: 'Send vote' })).toBeVisible();
  await expect(second.phone.getByText('Live results')).toHaveCount(0);

  // The first phone's chart follows the second vote live.
  await second.phone.getByText('Salad', { exact: true }).click();
  await second.phone.getByRole('button', { name: 'Send vote' }).click();
  await expect(first.phone.getByText('50%')).toHaveCount(2);

  // Hiding the results on the presenter screen takes them off the phones.
  await page.keyboard.press('h');
  await expect(first.phone.getByRole('heading', { name: 'Live results' })).toHaveCount(0);

  for (const { context } of phones) await context.close();
});
