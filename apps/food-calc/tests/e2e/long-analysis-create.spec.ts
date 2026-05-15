import { test, expect } from '@playwright/test';
import { signUpAndVerify } from './analysisHelpers';

// Acceptance 8 — create a long analysis from the AnalysesPage. /api/analyze
// and /api/analyses* are stubbed via page.route so no LLM job runs. NOT yet
// run in CI — see analysisHelpers.ts.

test.describe('long analysis — create', () => {
  test('create → POST body shape → row visible as «идёт» → detail modal', async ({
    page,
  }) => {
    let postBody: Record<string, unknown> | null = null;

    // Empty list — the optimistic prepend is what surfaces the new row.
    await page.route('**/api/analyses', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ analyses: [] }),
      });
    });

    await page.route('**/api/analyze', async (route) => {
      postBody = route.request().postDataJSON() as Record<string, unknown>;
      const b = postBody as {
        id: string;
        windowStart: string;
        windowEnd: string;
        payload?: { hypotheses?: unknown[] };
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          analysis: {
            id: b.id,
            user_id: 'e2e',
            window_start: b.windowStart,
            window_end: b.windowEnd,
            result_md: '',
            idea_cards: [],
            applied_hypotheses: b.payload?.hypotheses ?? [],
            created_at: new Date().toISOString(),
          },
        }),
      });
    });

    // Detail poll — still pending.
    await page.route('**/api/analyses/*', async (route) => {
      const b = postBody as { id: string; windowStart: string; windowEnd: string };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          analysis: {
            id: b.id,
            user_id: 'e2e',
            window_start: b.windowStart,
            window_end: b.windowEnd,
            result_md: '',
            idea_cards: [],
            applied_hypotheses: [],
            created_at: new Date().toISOString(),
          },
        }),
      });
    });

    await signUpAndVerify(page);

    // Seed one hypothesis so the drawer has something to tick.
    await page.evaluate(async () => {
      const e2e = (
        window as unknown as {
          __e2e: { bulkAdd: (t: string, r: unknown[]) => Promise<unknown> };
        }
      ).__e2e;
      await e2e.bulkAdd('hypotheses', [
        {
          id: 'h-e2e-1',
          title: 'Меньше сахара',
          body: 'Сахар во второй половине дня',
          created_at: new Date().toISOString(),
        },
      ]);
    });

    await page.goto('/analyses');
    await expect(
      page.getByRole('tab', { name: 'Разборы' }),
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: '+ Анализ' }).click();
    await expect(
      page.getByRole('heading', { name: 'Разбор по неделям' }),
    ).toBeVisible();

    // Tick the seeded hypothesis (the checkbox input is visually hidden).
    await page
      .getByRole('checkbox', { name: 'Включить в разбор: Меньше сахара' })
      .check({ force: true });

    await page.getByRole('button', { name: 'Запустить разбор' }).click();

    // Regression guard: payload.hypotheses is {id,title,body} — no lifecycle.
    expect(postBody).not.toBeNull();
    const payload = (
      postBody as unknown as { payload?: { hypotheses?: unknown[] } }
    ).payload;
    expect(payload?.hypotheses).toEqual([
      {
        id: 'h-e2e-1',
        title: 'Меньше сахара',
        body: 'Сахар во второй половине дня',
      },
    ]);

    // The pending row shows in the list right away as «идёт».
    await expect(page.getByText('идёт')).toBeVisible({ timeout: 10_000 });

    // Tapping it opens the detail modal (still pending).
    await page.getByText('идёт').click();
    await expect(page.getByText(/Разбор ещё идёт/i)).toBeVisible();
  });
});
