import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@ebidding.com';
const PASSWORD = 'Password123';

test.describe('Audit & Reporting', () => {
  test('admin can access reports page via direct navigation', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await page.goto('/reporting');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Reports & Analytics').first()).toBeVisible();
    await expect(page.getByText('Total Procurements')).toBeVisible();
    await expect(page.getByText('Export CSV')).toBeVisible();
  });

  test('admin can access audit page via direct navigation', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await page.goto('/audit');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Audit Logs').first()).toBeVisible();
  });
});
