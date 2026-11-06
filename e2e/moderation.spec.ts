import { devices, expect, test } from '@playwright/test';

test('the presenter hides a word from the cloud, and it stays hidden', async ({
  page,
  browser,
}) => {
  await page.goto('/new');
  await page.getByLabel('Name').fill('Moderation');
  await page.getByRole('button', { name: 'Create presentation' }).click();
  await page.getByRole('button', { name: /Word cloud/ }).click();
  await page.getByLabel('Question', { exact: true }).fill('One word for today?');
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  const code =
    (await page.getByText(/Join code \d{3} \d{3}/).textContent())?.replace(/\D/g, '') ?? '';
  await page.getByRole('button', { name: 'Present', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'One word for today?' })).toBeVisible();

  const phoneContext = await browser.newContext({ ...devices['Pixel 7'] });
  const phone = await phoneContext.newPage();
  await phone.goto(`/join/${code}`);
  const send = async (word: string) => {
    await phone.getByLabel('Your answer').fill(word);
    await phone.getByRole('button', { name: 'Send' }).click();
    await expect(phone.getByRole('heading', { name: 'Answer sent' })).toBeVisible();
  };
  await send('Calm');
  await phone.getByRole('button', { name: /Add another answer/ }).click();
  await send('spam');
  await expect(page.getByText(/spam: 1 answer/)).toBeAttached();

  // M opens moderation: the cloud becomes a list with a hide button per word.
  await page.keyboard.press('m');
  await expect(page.getByText('Select ✕ to take an answer off the screen.')).toBeVisible();
  await page.getByRole('button', { name: 'Hide “spam”' }).click();
  await expect(page.getByText('1 answer hidden')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hide “spam”' })).toHaveCount(0);

  // Sending it again in other letters doesn't bring it back.
  await phone.getByRole('button', { name: /Add another answer/ }).click();
  await send('SPAM');
  await expect(page.getByText('2 answers hidden')).toBeVisible();

  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText(/Calm: 1 answer/)).toBeAttached();
  await expect(page.getByText(/spam/i)).toHaveCount(0);

  // Show them again restores both.
  await page.getByRole('button', { name: 'Moderate answers' }).click();
  await page.getByRole('button', { name: 'Show them again' }).click();
  await expect(page.getByRole('button', { name: 'Hide “spam”' })).toBeVisible();

  await phoneContext.close();
});
