import { test, expect } from '@playwright/test';

const PROCUREMENT_EMAIL = 'procurement@ebidding.com';
const PASSWORD = 'Password123';

test.describe('Bidding Room', () => {
  test('procurement user can access bidding room via direct navigation', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(PROCUREMENT_EMAIL);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await page.goto('/bidding');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('E-Bidding Room').first()).toBeVisible();
  });

  test('shows bidding rounds after selecting a procurement', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(PROCUREMENT_EMAIL);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await page.route('**/procurements*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 'proc-1', requestNo: 'REQ-001', title: 'Test Procurement', currency: 'USD' }], meta: { total: 1 } }),
      });
    });
    await page.route('**/ebidding/rounds/procurement/proc-1', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'round-1', roundNo: 1, status: 'OPEN', startsAt: new Date().toISOString(), responses: [] }]),
      });
    });

    await page.goto('/bidding');
    await page.waitForLoadState('networkidle');
    await page.locator('select').first().selectOption('proc-1');
    await page.waitForTimeout(500);
    await expect(page.getByText('Round 1')).toBeVisible();
  });
});
