import { test, expect } from '@playwright/test';
import { signUpAndVerify } from './analysisHelpers';

// AnalysisKindDrawer gating — the «Текущий день» option is disabled on an
// empty day or offline, while «По неделям» is always reachable. NOT yet run
// in CI — see analysisHelpers.ts.

test.describe('AnalysisKindDrawer', () => {
  test('empty day: «Текущий день» disabled, «По неделям» → /analyses', async ({
    page,
  }) => {
    await signUpAndVerify(page);
    // No schedule food seeded → the day is empty.

    await page.getByRole('tab', { name: 'Анализ' }).first().click();
    await page.getByRole('button', { name: 'Анализировать' }).click();
    await expect(
      page.getByRole('heading', { name: 'Что разобрать?' }),
    ).toBeVisible();

    // Anchored name match — `По неделям` is also a substring of the HomePage
    // «Анализ по неделям →» link, so `^` keeps this to the drawer option.
    const dailyOption = page.getByRole('button', { name: /^Текущий день/ });
    await expect(dailyOption).toBeDisabled();

    const longOption = page.getByRole('button', { name: /^По неделям/ });
    await expect(longOption).toBeEnabled();

    await longOption.click();
    await expect(page).toHaveURL(/\/analyses$/);
  });

  test('offline: «Текущий день» disabled with a no-network hint', async ({
    page,
  }) => {
    await signUpAndVerify(page);
    await page.context().setOffline(true);

    await page.getByRole('tab', { name: 'Анализ' }).first().click();
    await page.getByRole('button', { name: 'Анализировать' }).click();

    const dailyOption = page.getByRole('button', { name: /^Текущий день/ });
    await expect(dailyOption).toBeDisabled();
    await expect(page.getByText(/Нет сети/)).toBeVisible();

    await page.context().setOffline(false);
  });
});
