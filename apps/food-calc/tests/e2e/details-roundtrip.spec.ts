import { test, expect } from '@playwright/test';

// Round-trip test for the prep-method/details plan (apps/food-calc/tds/
// prep-method-plan.md): schedule_food.details + custom_tags must survive a
// full local dump → wipe → apply cycle untouched. The snapshot blob is what
// PUT/GET /api/backup exchange, so this is a stand-in for "did the new
// custom_tags table get plumbed into the backup payload?".
//
// Auth is intentionally skipped — bridge.dumpLocal/applyLocal/bulkAdd/
// listTable operate directly on Dexie without requiring a session. This
// keeps the test independent of backend-side e2e user seeding.

type Bridge = {
  wipeLocal: () => Promise<void>;
  dumpLocal: () => Promise<Record<string, unknown[]>>;
  applyLocal: (snap: Record<string, unknown[]>) => Promise<void>;
  bulkAdd: (name: string, rows: unknown[]) => Promise<unknown>;
  listTable: (name: string) => Promise<unknown[]>;
};

test('schedule_food.details + custom_tags survive dump→wipe→apply', async ({ page }) => {
  // Block backup HTTP traffic so BackupGate's pull() doesn't try to reach
  // backend or touch our seeded rows; the test seeds Dexie directly.
  await page.route('**/api/backup**', (route) =>
    route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
  );
  await page.route('**/api/auth/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(null),
    }),
  );

  await page.goto('/');

  // Wait for the bridge's Dexie helpers to be installed. No session check —
  // BackupGate may never resolve auth in this stub environment, but bridge
  // installs synchronously from main.tsx.
  await page.waitForFunction(
    () => {
      const e2e = (window as unknown as { __e2e?: { bulkAdd?: unknown } }).__e2e;
      return !!e2e && typeof e2e.bulkAdd === 'function';
    },
    { timeout: 30_000 },
  );

  await page.evaluate(async () => {
    const e2e = (window as unknown as { __e2e: Bridge }).__e2e;
    await e2e.wipeLocal();
  });

  const seededFood = {
    id: 'sf-1',
    date: '12-05-2026',
    time: '13:00',
    type: 'food',
    quantity: 200,
    details: 'жареное, без масла, домашнее',
    product_id: '4185',
    dish_id: null,
    created_at: '2026-05-12T13:00:00.000Z',
  };

  const seededTags = [
    {
      id: 'ct-1',
      product_id: '4185',
      tag: 'домашнее',
      created_at: '2026-05-12T13:00:01.000Z',
    },
    {
      id: 'ct-2',
      product_id: '4185',
      tag: 'дядиной рукой',
      created_at: '2026-05-12T13:00:02.000Z',
    },
  ];

  await page.evaluate(
    async ({ food, tags }) => {
      const e2e = (window as unknown as { __e2e: Bridge }).__e2e;
      await e2e.bulkAdd('schedule_foods', [food]);
      await e2e.bulkAdd('custom_tags', tags);
    },
    { food: seededFood, tags: seededTags },
  );

  const snapshot = await page.evaluate(async () => {
    const e2e = (window as unknown as { __e2e: Bridge }).__e2e;
    return e2e.dumpLocal();
  });

  expect(snapshot.schedule_foods).toBeDefined();
  expect(snapshot.custom_tags).toBeDefined();
  expect(snapshot.schedule_foods).toHaveLength(1);
  expect(snapshot.custom_tags).toHaveLength(2);

  await page.evaluate(async () => {
    const e2e = (window as unknown as { __e2e: Bridge }).__e2e;
    await e2e.wipeLocal();
  });

  // Confirm wipe actually emptied things, then apply the snapshot back.
  const wiped = await page.evaluate(async () => {
    const e2e = (window as unknown as { __e2e: Bridge }).__e2e;
    return [
      (await e2e.listTable('schedule_foods')).length,
      (await e2e.listTable('custom_tags')).length,
    ];
  });
  expect(wiped).toEqual([0, 0]);

  await page.evaluate(async (snap) => {
    const e2e = (window as unknown as { __e2e: Bridge }).__e2e;
    await e2e.applyLocal(snap);
  }, snapshot);

  const restored = await page.evaluate(async () => {
    const e2e = (window as unknown as { __e2e: Bridge }).__e2e;
    return {
      foods: await e2e.listTable('schedule_foods'),
      tags: await e2e.listTable('custom_tags'),
    };
  });

  expect(restored.foods).toHaveLength(1);
  expect((restored.foods[0] as { details: string }).details).toBe(
    'жареное, без масла, домашнее',
  );
  expect(restored.tags).toHaveLength(2);
  expect(
    (restored.tags as Array<{ tag: string }>).map((r) => r.tag).sort(),
  ).toEqual(['домашнее', 'дядиной рукой'].sort());
});
