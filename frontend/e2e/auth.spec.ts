import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('logs in and views dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();

    await page.getByLabel('Email').fill('admin@ebidding.com');
    await page.getByLabel('Password').fill('Password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    await expect(page.getByText('Dashboard').first()).toBeVisible();
  });
});
