import { expect, type Page } from '@playwright/test';
import { format } from 'date-fns';

// Shared helpers for the session-D analysis E2E specs (home-and-analyses-ui).
//
// NOTE: these specs drive the real dev:e2e backend for auth + backup, but
// stub every /api/analyze* endpoint via page.route so no LLM tokens are
// burned and the runs are deterministic. They have NOT been executed in CI
// yet — selectors may need a runtime pass against the live DOM.

/** dd-MM-yyyy key for today — the HomePage / schedule route param. */
export function todayKey(): string {
  return format(new Date(), 'dd-MM-yyyy');
}

/** Wait for window.__e2e without requiring a session (signed-out boot). */
export async function waitForBridgeNoSession(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const e2e = (window as unknown as { __e2e?: { getSession?: unknown } })
        .__e2e;
      return !!e2e && typeof e2e.getSession === 'function';
    },
    { timeout: 30_000 },
  );
}

/**
 * Full signup + email-verification against the real backend — leaves the SPA
 * logged in (AuthScreen unmounted). Mirrors auth-flow.spec.ts.
 */
export async function signUpAndVerify(page: Page): Promise<string> {
  const email = `e2e-analysis-${Date.now()}-${Math.floor(
    Math.random() * 1e4,
  )}@disher.test`;
  const password = 'e2e-test-password-12';

  await page.goto('/');
  await waitForBridgeNoSession(page);

  await page.getByRole('button', { name: /Зарегистрироваться/ }).click();
  await page.getByPlaceholder('Email').fill(email);
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await page.getByPlaceholder(/Пароль/).fill(password);
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();

  await expect(
    page.getByRole('heading', { name: /Проверьте почту/ }),
  ).toBeVisible({ timeout: 15_000 });

  await page.evaluate(async (em) => {
    const e2e = (
      window as unknown as {
        __e2e: { verifyEmail: (e: string) => Promise<unknown> };
      }
    ).__e2e;
    await e2e.verifyEmail(em);
  }, email);

  await expect(
    page.getByRole('heading', { name: /Проверьте почту/ }),
  ).toBeHidden({ timeout: 10_000 });

  return email;
}

/**
 * Seed one schedule_food for `date` into Dexie via the bridge so a day is not
 * «пустой» — the «Текущий день» option in AnalysisKindDrawer needs it.
 */
export async function seedScheduleFood(page: Page, date: string): Promise<void> {
  await page.evaluate(async (d) => {
    const e2e = (
      window as unknown as {
        __e2e: { bulkAdd: (t: string, r: unknown[]) => Promise<unknown> };
      }
    ).__e2e;
    const iso = new Date().toISOString();
    await e2e.bulkAdd('products', [
      {
        id: 'e2e-prod-oat',
        name: 'Овсянка',
        source: '',
        nutrients: {},
        portions: [],
        categories: [],
        serving_basis: '100g',
        serving_unit: null,
        created_at: iso,
      },
    ]);
    await e2e.bulkAdd('schedule_foods', [
      {
        id: `e2e-sf-${Date.now()}`,
        date: d,
        time: '09:00',
        type: 'food',
        quantity: 200,
        details: '',
        product_id: 'e2e-prod-oat',
        dish_id: null,
        created_at: iso,
      },
    ]);
  }, date);
}

/** Build an SSE event-stream body — markdown sliced into delta chunks. */
export function sseEventStream(markdown: string): string {
  const CHUNK = 48;
  let body = '';
  for (let i = 0; i < markdown.length; i += CHUNK) {
    const content = markdown.slice(i, i + CHUNK);
    body += `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
  }
  body += 'data: [DONE]\n\n';
  return body;
}

/** A daily-analysis markdown body that carries a parseable ideas section. */
export const DAILY_MARKDOWN = `Сегодня ты поел довольно ровно, но кофе во второй половине дня мог сдвинуть сон.

## Идеи для эксперимента

- **Кофе только до обеда** — попробуй неделю не пить кофе после 14:00 и отметить сон`;
