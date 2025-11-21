import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect the page to have the correct title
  await expect(page).toHaveTitle('mc-plator');
});

test('calculator functionality', async ({ page }) => {
  await page.goto('/');

  // Expect MCPlator heading to be visible
  await expect(page.getByRole('heading', { name: 'MCPlator' })).toBeVisible();

  // Check initial count is 0
  await expect(page.getByText('0')).toBeVisible();

  // Click increment button
  await page.getByRole('button', { name: 'Increment (+)' }).click();
  await expect(page.getByText('1')).toBeVisible();

  // Click increment again
  await page.getByRole('button', { name: 'Increment (+)' }).click();
  await expect(page.getByText('2')).toBeVisible();

  // Click decrement button
  await page.getByRole('button', { name: 'Decrement (-)' }).click();
  await expect(page.getByText('1')).toBeVisible();

  // Click reset button
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.getByText('0')).toBeVisible();
});
