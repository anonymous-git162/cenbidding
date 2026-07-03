import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');
    await page.getByLabel('Email').fill('requester@ebidding.com');
    await page.getByLabel('Password').fill('Password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('renders KPI cards with key metrics', async ({ page }) => {
    const kpiLabels = ['Total', 'Drafts', 'Pending', 'Active', 'Completed', 'Rejected'];
    for (const label of kpiLabels) {
      await expect(page.getByText(label).first()).toBeVisible();
    }
  });

  test('shows recent procurements section', async ({ page }) => {
    await expect(page.getByText('Recent Procurements').first()).toBeVisible();
  });

  test('shows recent activity section', async ({ page }) => {
    await expect(page.getByText('Recent Activity').first()).toBeVisible();
  });

  test('shows quick actions sidebar', async ({ page }) => {
    await expect(page.getByText('Quick Actions').first()).toBeVisible();
    await expect(page.getByText('New Request').first()).toBeVisible();
    await expect(page.getByText('My Requests').first()).toBeVisible();
  });

  test('can navigate to procurements via sidebar link', async ({ page }) => {
    await page.getByText('My Requests').first().click();
    await expect(page).toHaveURL(/\/procurements/, { timeout: 10000 });
  });

  test('shows approval inbox when logged in as approver', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');
    await page.getByLabel('Email').fill('approver@ebidding.com');
    await page.getByLabel('Password').fill('Password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    await expect(page.getByText('Quick Actions').first()).toBeVisible();
    await expect(page.getByText('Approval Inbox').first()).toBeVisible();
  });
});
