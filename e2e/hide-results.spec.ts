import { devices, expect, test } from '@playwright/test';

test('hidden results show only a count until the presenter reveals them', async ({
  page,
  browser,
}) => {
  await page.goto('/new');
  await page.getByLabel('Name').fill('Quiz night');
  await page.getByRole('button', { name: 'Create presentation' }).click();
  await page.getByRole('button', { name: /Multiple choice/ }).click();
  await page.getByLabel('Question', { exact: true }).fill('Capital of Australia?');
  await page.getByRole('textbox', { name: 'Option 1' }).fill('Sydney');
  await page.getByRole('textbox', { name: 'Option 2' }).fill('Canberra');
  await page.getByRole('checkbox', { name: /Hide results until I reveal them/ }).check();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  const code =
    (await page.getByText(/Join code \d{3} \d{3}/).textContent())?.replace(/\D/g, '') ?? '';

  await page.getByRole('button', { name: 'Present', exact: true }).click();
  await expect(page.getByText('Results are hidden')).toBeVisible();
  await expect(page.getByText('0 answers')).toBeVisible();

  const phoneContext = await browser.newContext({ ...devices['Pixel 7'] });
  const phone = await phoneContext.newPage();
  await phone.goto(`/join/${code}`);
  await phone.getByText('Canberra', { exact: true }).click();
  await phone.getByRole('button', { name: 'Send vote' }).click();
  await expect(phone.getByRole('heading', { name: 'Answer sent' })).toBeVisible();

  // The count moves, the bars stay hidden.
  await expect(page.getByText('1 answer', { exact: true })).toBeVisible();
  await expect(page.getByText('100%')).toHaveCount(0);

  await page.getByRole('button', { name: 'Show results' }).first().click();
  await expect(page.getByText('100%')).toBeVisible();
  await expect(page.getByText('Results are hidden')).toHaveCount(0);

  // H hides them again.
  await page.keyboard.press('h');
  await expect(page.getByText('Results are hidden')).toBeVisible();

  await phoneContext.close();
});
