import { test, expect } from '@playwright/test';
import { signUpAndVerify, seedScheduleFood, todayKey } from './analysisHelpers';

// Acceptance 4 — a reload mid-stream. The daily SSE route is left hanging
// (never fulfilled) so the stream sits at `streaming`; the reload then drives
// the boot-flip streaming → interrupted. NOT yet run in CI.
//
// The date-switch interruption (manual smoke #6) is not covered here — it
// depends on the HomeTopBar date-drawer DOM; it stays a manual check.

test.describe('daily analysis — interrupted', () => {
  test('reload mid-stream → interrupted banner, retry restarts', async ({
    page,
  }) => {
    // Hang the request — the response never completes, so the store record
    // stays `streaming` (and is persisted to idb-keyval that way).
    await page.route('**/api/analyze/daily', async () => {
      await new Promise(() => { });
    });

    await signUpAndVerify(page);
    const date = todayKey();
    await seedScheduleFood(page, date);

    await page.getByRole('tab', { name: 'Анализ' }).first().click();
    await page.getByRole('button', { name: 'Анализировать' }).click();
    await page.getByText('Текущий день').click();

    // Streaming state is on screen.
    await expect(page.getByText(/Разбираем день/i)).toBeVisible({
      timeout: 10_000,
    });

    // Hard reload — boot hydration flips streaming → interrupted.
    await page.reload();
    await page.getByRole('tab', { name: 'Анализ' }).first().click();

    // «Разбор прерван» (NOT «не удался») + the restart action.
    await expect(page.getByText('Разбор прерван')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Разбор не удался')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Запустить заново' }),
    ).toBeVisible();
  });
});
