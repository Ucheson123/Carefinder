import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Points to local Vite development server
  await page.goto('http://localhost:5173/');
});

test.describe('Carefinder E2E Feature Tests', () => {

  test('1. Search functionality updates the URL', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search hospitals...');
    await searchInput.fill('Lagos');
    await expect(page).toHaveURL(/.*q=Lagos/);
  });

  test('2. Export CSV Modal opens correctly', async ({ page }) => {
    await page.locator('button[title="Export to CSV"]').click();
    await expect(page.getByText('Select the data columns')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download CSV File' })).toBeVisible();
  });

  test('3. Shareable Link copies to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('button[title="Copy Shareable Link"]').click();
    await expect(page.getByText('Shareable link copied!')).toBeVisible();
  });

  test('4. Specialty Filter updates the URL state', async ({ page }) => {
    const specialtyDropdown = page.locator('select');
    await specialtyDropdown.selectOption('Maternity');
    await expect(page).toHaveURL(/.*specialty=Maternity/);
  });

  test('5. Email Share Modal opens correctly', async ({ page }) => {
    await page.locator('button[title="Share via Email"]').click();
    await expect(page.getByPlaceholder('colleague@carefinder.com')).toBeVisible();
    await expect(page.getByText('Share via Email')).toBeVisible();
  });

});