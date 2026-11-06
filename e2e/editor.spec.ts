import { expect, type Page, test } from '@playwright/test';

async function addQuestion(page: Page, type: RegExp, title: string) {
  await page.getByRole('button', { name: 'Add question' }).click();
  await page.getByRole('button', { name: type }).click();
  await page.getByLabel('Question', { exact: true }).fill(title);
  await expect(page.getByText('Saved')).toBeVisible();
}

test('questions can be reordered by dragging them in the list', async ({ page }) => {
  await page.goto('/new');
  await page.getByLabel('Name').fill('Drag test');
  await page.getByRole('button', { name: 'Create presentation' }).click();
  await page.getByRole('button', { name: /Word cloud/ }).click();
  await page.getByLabel('Question', { exact: true }).fill('First');
  await expect(page.getByText('Saved')).toBeVisible();
  await addQuestion(page, /Scale/, 'Second');
  await addQuestion(page, /Open question/, 'Third');

  const list = page.getByRole('complementary').getByRole('listitem');
  await expect(list).toHaveText(['1First', '2Second', '3Third']);

  // Drop "Third" on the upper half of "First": it becomes the first question.
  await list.nth(2).dragTo(list.nth(0), { targetPosition: { x: 40, y: 4 } });
  await expect(list).toHaveText(['1Third', '2First', '3Second']);

  // The order was saved on the server.
  await page.reload();
  await expect(list).toHaveText(['1Third', '2First', '3Second']);
});
