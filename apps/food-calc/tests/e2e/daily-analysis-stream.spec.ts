import { test, expect } from '@playwright/test';
import {
  signUpAndVerify,
  seedScheduleFood,
  todayKey,
  sseEventStream,
  DAILY_MARKDOWN,
} from './analysisHelpers';

// Acceptance 2 + idea-card «+ в гипотезы». The daily SSE endpoint is stubbed
// via page.route with a pre-recorded event-stream — no LLM tokens, fully
// deterministic. NOT yet run in CI — see analysisHelpers.ts.

test.describe('daily analysis — SSE stream', () => {
  test('streams markdown, parses ideas, sends human-readable food names', async ({
    page,
  }) => {
    let dailyBody: Record<string, unknown> | null = null;

    await page.route('**/api/analyze/daily', async (route) => {
      dailyBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: sseEventStream(DAILY_MARKDOWN),
      });
    });

    await signUpAndVerify(page);
    const date = todayKey();
    await seedScheduleFood(page, date);

    // HomePage Laboratory is slide 0 — bring it on-screen via the indicator.
    await page.getByRole('tab', { name: 'Лаборатория' }).first().click();

    await page.getByRole('button', { name: 'Анализировать' }).click();
    await expect(
      page.getByRole('heading', { name: 'Что разобрать?' }),
    ).toBeVisible();
    await page.getByText('Текущий день').click();

    // The streamed markdown lands in the inline DailyAnalysisSection.
    await expect(
      page.getByText(/кофе во второй половине дня/i),
    ).toBeVisible({ timeout: 15_000 });

    // The ideas section was parsed into a card.
    const ideaTitle = page.getByText('Кофе только до обеда');
    await expect(ideaTitle).toBeVisible();

    // Regression guard #1: the POST body carries the human-readable food
    // name, never a product_id UUID.
    expect(dailyBody).not.toBeNull();
    const foods = (
      dailyBody as unknown as { scheduleFoods?: Array<{ name?: string }> }
    ).scheduleFoods;
    expect(Array.isArray(foods)).toBe(true);
    expect(foods?.[0]?.name).toBe('Овсянка');

    // «+ в гипотезы» turns the idea into a saved hypothesis.
    await page.getByRole('button', { name: '+ в гипотезы' }).first().click();
    await expect(page.getByText('✓ добавлено')).toBeVisible();
  });
});
