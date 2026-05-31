import { test, expect } from '@playwright/test';
import { signUpAndVerify } from './analysisHelpers';

// Acceptance — hypothesis create / edit / delete on the HomePage Laboratory,
// plus the mirror on the AnalysesPage hypotheses slide. Create is now the
// inline composer (HypothesisComposer, title-only); edit/delete still go
// through EditHypothesisModal. Pure Dexie + UI, no analysis endpoints touched.
// NOT yet run in CI.

test.describe('hypothesis CRUD', () => {
  test('create (inline) → edit → mirror on /analyses → delete', async ({ page }) => {
    await signUpAndVerify(page);

    // HomePage Laboratory is slide 0.
    await page.getByRole('tab', { name: 'Лаборатория' }).first().click();

    // ── Create via the inline composer ──────────────────────────────
    const composer = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Добавить гипотезу' }) });
    await composer.getByRole('textbox').fill('Сон и кофе');
    await composer.getByRole('button', { name: 'Добавить' }).click();

    // The new row appears first, flagged with the ephemeral «new» ring.
    await expect(
      page.locator('[data-new]').filter({ hasText: 'Сон и кофе' }),
    ).toBeVisible();

    // ── Edit (tap row → EditHypothesisModal) ────────────────────────
    await page.getByText('Сон и кофе').click();
    await expect(page.getByRole('heading', { name: 'Гипотеза' })).toBeVisible();
    // The composer and the edit modal share the title placeholder; the
    // modal's input is portaled last in the DOM.
    await page
      .getByPlaceholder('Коротко — что проверяем')
      .last()
      .fill('Сон, кофе и чай');
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
    await page.getByRole('button', { name: 'Удалить', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Удалить гипотезу?' }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Удалить', exact: true })
      .last()
      .click();

    await expect(page.getByText('Сон, кофе и чай')).toHaveCount(0);
  });
});
