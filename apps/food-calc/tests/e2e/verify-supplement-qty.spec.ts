import { test, expect } from '@playwright/test';
import { signUpAndVerify } from './analysisHelpers';

// VERIFY (finding 1): adding an EXISTING supplement (serving-based product) to a
// day via SearchFood → the «Порция» step must show unit «шт» and default 1,
// NOT «100 г». Drives the real create flow on the HomePage schedule.

const SUP_NAME = `E2EВитаминД${Date.now()}`;
const SUP_ID = `e2e-sup-${Date.now()}`;

test('supplement quantity step shows шт + default 1 (not 100 г)', async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto('/');
  // Bridge is installed synchronously from main.tsx (test mode).
  await page.waitForFunction(
    () => {
      const e2e = (window as unknown as { __e2e?: { getSession?: unknown } }).__e2e;
      return !!e2e && typeof e2e.getSession === 'function';
    },
    { timeout: 30_000 },
  );

  // Sign up only if there's no live session (a reused dev server may already be
  // authenticated).
  const session = await page.evaluate(() =>
    (window as unknown as { __e2e: { getSession: () => Promise<unknown> } }).__e2e.getSession(),
  );
  if (!session) {
    await signUpAndVerify(page);
  }

  // Seed an existing supplement product (serving_basis='serving', unit='шт').
  await page.evaluate(
    async ({ id, name }) => {
      const e2e = (
        window as unknown as {
          __e2e: { bulkAdd: (t: string, r: unknown[]) => Promise<unknown> };
        }
      ).__e2e;
      await e2e.bulkAdd('products', [
        {
          id,
          name,
          source: '',
          nutrients: { '29': 50 }, // non-empty so it isn't flagged "missing"
          portions: [],
          categories: [],
          serving_basis: 'serving',
          serving_unit: 'шт',
          created_at: new Date().toISOString(),
        },
      ]);
    },
    { id: SUP_ID, name: SUP_NAME },
  );

  // Open SearchFood via the write-bar medal (label htmlFor=schedule-fe-search).
  await page.locator('label[for="schedule-fe-search"]').first().click();
  const searchInput = page.locator('#schedule-fe-search');
  await expect(searchInput).toBeVisible({ timeout: 10_000 });
  await searchInput.fill(SUP_NAME);

  // Click the matching result card (label htmlFor=schedule-fe-quantity).
  const card = page.getByText(SUP_NAME, { exact: false }).first();
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.click();

  // Quantity step: the hero number input is #schedule-fe-quantity.
  const qtyInput = page.locator('#schedule-fe-quantity');
  await expect(qtyInput).toBeVisible({ timeout: 10_000 });

  // Give the resetKey effect a tick to re-sync value to the basis default.
  await page.waitForTimeout(500);

  const value = await qtyInput.inputValue();
  const bodyText = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  console.log('QTY INPUT VALUE =', JSON.stringify(value));
  console.log('BODY has «шт»? ', bodyText.includes('шт'));
  console.log('BODY has «100 г»? ', bodyText.includes('100'));

  await page.screenshot({
    path: 'C:/Users/booty/AppData/Local/Temp/claude/c--Users-booty-Documents-GitHub-disher/65b18066-6050-41ac-99aa-2a50250d8a85/scratchpad/supplement-qty-step.png',
  });

  // Assertions: default is 1 (not 100), and unit «шт» is shown.
  expect(value).toBe('1');
  await expect(page.getByText('шт', { exact: true }).first()).toBeVisible();
});
