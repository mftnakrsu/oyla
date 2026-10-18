import { devices, expect, test } from '@playwright/test';

test('a participant votes and the presenter sees it live', async ({ page, browser }) => {
  // Presenter: create a presentation with one multiple-choice question.
  await page.goto('/');
  await page.getByRole('link', { name: 'Create presentation' }).click();
  await page.getByLabel('Name').fill('E2E retro');
  await page.getByRole('button', { name: 'Create presentation' }).click();
  await expect(page.getByRole('heading', { name: 'Keep this link' })).toBeVisible();
  await expect(page).not.toHaveURL(/#key=/);

  await page.getByRole('button', { name: /Multiple choice/ }).click();
  await page.getByLabel('Question', { exact: true }).fill('Tea or coffee?');
  await page.getByRole('textbox', { name: 'Option 1' }).fill('Tea');
  await page.getByRole('textbox', { name: 'Option 2' }).fill('Coffee');
  await expect(page.getByText('Saved')).toBeVisible();
  const code =
    (await page.getByText(/Join code \d{3} \d{3}/).textContent())?.replace(/\D/g, '') ?? '';
  expect(code).toMatch(/^\d{6}$/);

  // The theme picked in the editor follows the presentation to every screen.
  await page.getByText('Indigo', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'indigo');

  await page.getByRole('button', { name: 'Present', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tea or coffee?' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'indigo');

  // Participant on a phone, in a separate browser context.
  const phoneContext = await browser.newContext({ ...devices['Pixel 7'] });
  const phone = await phoneContext.newPage();
  await phone.goto('/');
  await phone.getByLabel('Join code').fill(code);
  await phone.getByRole('button', { name: 'Join' }).click();
  await expect(phone.getByRole('heading', { name: 'Tea or coffee?' })).toBeVisible();
  await expect(phone.locator('html')).toHaveAttribute('data-palette', 'indigo');
  await expect(page.getByText('1 person here')).toBeVisible();

  await phone.getByText('Coffee', { exact: true }).click();
  await phone.getByRole('button', { name: 'Send vote' }).click();
  await expect(phone.getByRole('heading', { name: 'Answer sent' })).toBeVisible();
  await expect(phone.getByRole('button', { name: /Add another answer/ })).toHaveCount(0);

  // The presenter's bar chart updates without a reload.
  await expect(page.getByText('100%')).toBeVisible();
  await expect(page.getByText('1 vote', { exact: true })).toBeVisible();

  // Resetting gives the participant their vote back.
  // Resetting deletes answers, so it asks for a second click.
  await page.getByRole('button', { name: 'Reset results' }).click();
  await expect(page.getByText('1 vote', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Click again to reset' }).click();
  await expect(page.getByText('0 votes')).toBeVisible();
  await expect(phone.getByRole('button', { name: 'Send vote' })).toBeVisible();

  await phoneContext.close();
});

test('an unknown code explains what to do', async ({ page }) => {
  await page.goto('/join/000000');
  await expect(page.getByRole('heading', { name: 'Code not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Enter another code' })).toBeVisible();
});
