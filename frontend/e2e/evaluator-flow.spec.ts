import { test, expect } from '@playwright/test';

const EVALUATOR_EMAIL = 'evaluator@ebidding.com';
const PASSWORD = 'Password123';

test.describe('Evaluator Flow', () => {
  test('evaluator can access evaluation page via direct navigation', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(EVALUATOR_EMAIL);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await page.goto('/evaluation');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Evaluation Queue').first()).toBeVisible();
  });

  test('evaluator can access results page via direct navigation', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(EVALUATOR_EMAIL);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await page.goto('/results');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Procurement Results').first()).toBeVisible();
  });

  test('shows evaluation data when procurement is selected', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(EVALUATOR_EMAIL);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    await page.route('**/procurements*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 'proc-1', requestNo: 'REQ-001', title: 'Eval Procurement', status: 'EVALUATION' }], meta: { total: 1 } }),
      });
    });
    await page.route('**/evaluation/reviews/proc-1', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/rfq-submissions/procurement/proc-1', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/evaluation/proc-1/criteria', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/evaluation/consolidation/proc-1', (route) => {
      route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.goto('/evaluation');
    await page.waitForLoadState('networkidle');
    await page.locator('select').first().selectOption('proc-1');
    await page.waitForTimeout(500);
    await expect(page.getByText('No vendor submissions')).toBeVisible();
  });
});
