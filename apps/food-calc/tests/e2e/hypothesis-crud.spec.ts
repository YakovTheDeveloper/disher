import { test, expect } from '@playwright/test';
import { signUpAndVerify } from './analysisHelpers';

// Acceptance — hypothesis create / edit / delete on the /analyses hypotheses
// slide (the single, view-first surface as of 2026-06-13). Entry: the HomePage
// «Гипотезы» button navigates there. Create is the bottom write-bar
// (HypothesisWriteBar — title via the field, optional body via «Подробности»);
// edit/delete still go through EditHypothesisModal. Pure Dexie + UI, no analysis
// endpoints touched. NOT yet run in CI.

test.describe('hypothesis CRUD', () => {
  test('create (write-bar) → edit → delete on /analyses', async ({ page }) => {
    await signUpAndVerify(page);

    // HomePage Laboratory is slide 0; its «Гипотезы» button navigates to the
    // /analyses hypotheses slide (state.slide = 0 lands there directly).
    await page.getByRole('tab', { name: 'Анализ' }).first().click();
    await page.getByRole('button', { name: 'Гипотезы' }).click();
    await expect(page).toHaveURL(/\/analyses/);
    await expect(page.getByRole('tab', { name: 'Гипотезы' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // ── Create via the bottom write-bar ─────────────────────────────
    // Filling focuses the field → the send button («Добавить гипотезу») appears;
    // Enter submits, the bar clears + collapses (blurOnSubmit).
    const bar = page.getByPlaceholder('Опишите ваше предположение');
    await bar.click();
    await bar.fill('Сон и кофе');
    await bar.press('Enter');

    // The new row appears, flagged with the ephemeral «new» ring.
    await expect(
      page.locator('[data-new]').filter({ hasText: 'Сон и кофе' }),
    ).toBeVisible();

    // ── Edit (tap row → EditHypothesisModal) ────────────────────────
    await page.getByText('Сон и кофе').click();
    await expect(page.getByRole('heading', { name: 'Гипотеза' })).toBeVisible();
    // The edit modal's title input is portaled last in the DOM.
    await page
      .getByPlaceholder('Коротко — что проверяем')
      .last()
      .fill('Сон, кофе и чай');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText('Сон, кофе и чай')).toBeVisible();

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
