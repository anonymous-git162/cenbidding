import { test, expect } from '@playwright/test';

const VENDOR_EMAIL = 'vendor@ebidding.com';
const VENDOR_PASSWORD = 'Password123';

test.describe('Vendor Flow', () => {
  test('vendor can login and view invitations', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(VENDOR_EMAIL);
    await page.getByLabel('Password').fill(VENDOR_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await page.getByText('My Invitations').first().click();
    await expect(page).toHaveURL(/invitations/);
    await expect(page.getByRole('heading', { name: 'My Invitations' })).toBeVisible();
  });

  test('vendor can navigate to submissions', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(VENDOR_EMAIL);
    await page.getByLabel('Password').fill(VENDOR_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await page.getByText('Submissions').first().click();
    await expect(page).toHaveURL(/submissions/);
    await expect(page.getByRole('heading', { name: 'Submissions' })).toBeVisible();
  });

  test('vendor can view analytics', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(VENDOR_EMAIL);
    await page.getByLabel('Password').fill(VENDOR_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await page.getByText('Analytics').first().click();
    await expect(page).toHaveURL(/analytics/);
    await expect(page.getByRole('heading', { name: 'Vendor Analytics' })).toBeVisible();
  });

  test('vendor can see submissions page with procurements', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(VENDOR_EMAIL);
    await page.getByLabel('Password').fill(VENDOR_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await page.route('**/procurements*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 'sub-1', requestNo: 'REQ-001', title: 'Vendor Procurement', status: 'OPEN' }], meta: { total: 1 } }),
      });
    });

    await page.getByText('Submissions').first().click();
    await expect(page).toHaveURL(/submissions/);
    await expect(page.getByText('Submissions').first()).toBeVisible();
    await expect(page.getByText('Vendor Procurement')).toBeVisible();
  });
});
