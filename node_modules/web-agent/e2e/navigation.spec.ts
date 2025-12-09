import { test, expect } from '@playwright/test';

test('redirects home to overview and shows navigation', async ({ page }) => {
  await page.goto('/');
  await page.waitForURL('**/overview');
  await expect(page.getByText('Open tickets')).toBeVisible();
});
