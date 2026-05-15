import { test, expect } from '@playwright/test';
import { signUpAndVerify } from './analysisHelpers';

// Acceptance 1 — hypothesis create / edit / delete on the HomePage
// Laboratory, plus the mirror on the AnalysesPage hypotheses slide. Pure
// Dexie + UI, no analysis endpoints touched. NOT yet run in CI.

test.describe('hypothesis CRUD', () => {
  test('create → edit → mirror on /analyses → delete', async ({ page }) => {
    await signUpAndVerify(page);

    // HomePage Laboratory is slide 0.
    await page.getByRole('tab', { name: 'Лаборатория' }).first().click();

    // ── Create ──────────────────────────────────────────────────────
    await page.getByRole('button', { name: '+ Гипотеза' }).click();
    await expect(
      page.getByRole('heading', { name: 'Новая гипотеза' }),
    ).toBeVisible();
    await page
      .getByPlaceholder(/Напр\./)
      .fill('Сон и кофе');
    await page
      .getByPlaceholder(/Что именно отслеживаем/)
      .fill('Кофе после 16:00 портит сон');
    await page.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByText('Сон и кофе')).toBeVisible();

    // ── Edit ────────────────────────────────────────────────────────
    await page.getByText('Сон и кофе').click();
    await expect(
      page.getByRole('heading', { name: 'Гипотеза' }),
    ).toBeVisible();
    const titleInput = page.getByRole('textbox').first();
    await titleInput.fill('Сон, кофе и чай');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText('Сон, кофе и чай')).toBeVisible();

    // ── Mirror on /analyses hypotheses slide ────────────────────────
    await page.goto('/analyses');
    await page.getByRole('tab', { name: 'Гипотезы' }).click();
    await expect(page.getByText('Сон, кофе и чай')).toBeVisible({
      timeout: 10_000,
    });

    // ── Delete ──────────────────────────────────────────────────────
    await page.getByText('Сон, кофе и чай').click();
    await page.getByRole('button', { name: 'Удалить гипотезу' }).click();
    await expect(
      page.getByRole('heading', { name: 'Удалить гипотезу?' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Удалить', exact: true }).click();

    await expect(page.getByText('Сон, кофе и чай')).toHaveCount(0);
  });
});
