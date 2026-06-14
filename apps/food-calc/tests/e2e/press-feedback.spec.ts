import { test, expect, type Page, type Locator } from '@playwright/test';
import { installSupabaseMock } from './supabaseMock';
import { signUpAndVerify } from './analysisHelpers';

// Colored press-feedback smoke (canon 2026-06-08, см. project colored-press).
//
// Guards the ONE regression class /critique surfaced: a button fills with a dark
// accent on `:active` while a child keeps its own explicit dark colour → text /
// icon goes invisible (dark-on-dark) for the press duration. The assertion is
// COMPUTED-STYLE (relative luminance), NOT a pixel snapshot — robust across OS,
// no per-platform baselines to maintain.
//
// Reachable target without auth/seed: the AuthScreen (renders at `/` pre-login).
// `assertPressContrast` is the REUSABLE part — point it at chip/fill buttons in
// deeper flows once you've navigated/seeded there, e.g.:
//   await assertPressContrast(page, page.locator('[class*=dayChip]').first());
//   await assertPressContrast(page, swatch, swatch.locator('[class*=label]'));
//
// NB: this covers the *contrast* guard (platform-independent CSS). The separate
// iOS `:active`-won't-fire issue (fixed via the global touchstart enabler in
// app/index.tsx) is only observable on a real iPhone and is out of scope here —
// Playwright Desktop projects drive a mouse, where `:active` fires natively.

// Relative luminance (WCAG-ish) of a computed `rgb(...)`/`rgba(...)` string.
// Returns 0 (black) … 1 (white). Unparseable → -1 so the diff check fails loudly.
function luminance(css: string): number {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m || !m[1]) return -1;
  const nums = m[1].split(',').map((n) => parseFloat(n));
  const r = (nums[0] ?? 0) / 255;
  const g = (nums[1] ?? 0) / 255;
  const b = (nums[2] ?? 0) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Press `pressEl` (hold `:active`) and assert the text element stays legible —
 * its colour must contrast with the fill behind it. `textEl` defaults to the
 * pressed element itself; pass a child locator (e.g. a chip's number/label) to
 * guard the dark-on-dark class directly.
 */
async function assertPressContrast(page: Page, pressEl: Locator, textEl: Locator = pressEl) {
  await expect(pressEl).toBeVisible();
  const box = await pressEl.boundingBox();
  if (!box) throw new Error('pressEl has no bounding box');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  try {
    // Read while the press is held — `:active` is in effect.
    const bg = await pressEl.evaluate((n) => getComputedStyle(n as Element).backgroundColor);
    const fg = await textEl.evaluate((n) => getComputedStyle(n as Element).color);
    const delta = Math.abs(luminance(bg) - luminance(fg));
    expect(
      delta,
      `pressed contrast too low — bg ${bg} vs text ${fg} (Δlum ${delta.toFixed(3)}). Dark-on-dark?`,
    ).toBeGreaterThan(0.3);
  } finally {
    await page.mouse.up();
  }
}

/**
 * Press `pressEl` and assert that `surfaceEl` (the visible backdrop — may be an
 * ANCESTOR wrapper, not the button itself) actually fills dark on `:active`.
 * Guards the «подложка → инверсия» canon (2026-06-14): a pill whose inner button
 * fills ink while its padded wrapper stays light leaves a white halo. Contrast
 * (text↔bg) checks can't catch that — this asserts the surface luminance is low.
 */
async function assertPressedDark(page: Page, pressEl: Locator, surfaceEl: Locator) {
  await expect(pressEl).toBeVisible();
  const box = await pressEl.boundingBox();
  if (!box) throw new Error('pressEl has no bounding box');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  try {
    const bg = await surfaceEl.evaluate((n) => getComputedStyle(n as Element).backgroundColor);
    expect(
      luminance(bg),
      `pressed surface not dark — bg ${bg} (expected ink fill). White halo / no inversion?`,
    ).toBeLessThan(0.25);
  } finally {
    await page.mouse.up();
  }
}

test.describe('Colored press feedback', () => {
  test('pressed CTA keeps text↔background contrast (no dark-on-dark)', async ({ page }) => {
    await installSupabaseMock(page, 'ok');
    await page.goto('/');

    // Email-step CTA «Продолжить» enables once a valid email is entered.
    const email = page.getByPlaceholder('Email');
    await email.waitFor({ state: 'visible' });
    await email.fill('smoke@example.com');

    const submit = page.getByRole('button', { name: 'Продолжить' });
    await expect(submit).toBeEnabled();

    // On press the dark CTA stays dark fill + light text → high luminance delta.
    await assertPressContrast(page, submit);
  });
});

// Top-bar pill inversion (canon 2026-06-14: «подложка → инверсия в ink + белый»).
// Drives the REAL dev:e2e backend for auth (like the analysis specs) — NOT yet
// run in CI, selectors may need a runtime pass against the live HomePage DOM.
test.describe('Top-bar press inversion', () => {
  test('settings / date / nutrients pills invert to ink (legible, no halo)', async ({
    page,
  }) => {
    await signUpAndVerify(page); // lands logged-in on the HomePage (top bar visible)

    const gear = page.getByRole('button', { name: /Настройки и аккаунт/ });
    const date = page.getByRole('button', { name: 'Выбрать дату' });
    const nutrients = page.getByRole('button', { name: 'Открыть нутриенты' });

    // Each fills ink + white content on press → text stays legible (no dark-on-dark).
    await assertPressContrast(page, gear);
    // Date: guard the GOTCHA child (weekday has its own colour → must whiten too).
    await assertPressContrast(page, date, date.locator('[class*=dateWeekday]'));
    await assertPressContrast(page, nutrients);

    // Halo guard: the nutrients pill WRAPPER (.centerSlot, padded) — not just the
    // inner button — must fill ink, else its padding rings the fill with white.
    const centerSlot = nutrients
      .locator('xpath=ancestor::*[contains(@class,"centerSlot")]')
      .first();
    await assertPressedDark(page, nutrients, centerSlot);
  });
});
