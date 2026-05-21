import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/shared/lib/dexie/schema';
import { createProduct } from './mutations';

// createProduct пишет Dexie-строку. Тесты гоняются на fake-indexeddb
// (см. vitest.setup.ts: `fake-indexeddb/auto`).
describe('createProduct', () => {
  beforeEach(async () => {
    await db.products.clear();
  });

  it('создаёт обычный продукт по умолчанию (basis=100g, unit=null)', async () => {
    const id = await createProduct({ name: 'Tofu' });

    const row = await db.products.get(id);
    expect(row).toBeDefined();
    expect(row!.name).toBe('Tofu');
    expect(row!.serving_basis).toBe('100g');
    expect(row!.serving_unit).toBe(null);
  });

  it('создаёт supplement при isSupplement=true (basis=serving, unit=шт)', async () => {
    const id = await createProduct({ name: 'Vit D 2000 IU', isSupplement: true });

    const row = await db.products.get(id);
    expect(row!.serving_basis).toBe('serving');
    expect(row!.serving_unit).toBe('шт');
  });

  it('isSupplement=false читается как обычный продукт (без surprise)', async () => {
    const id = await createProduct({ name: 'Apple', isSupplement: false });

    const row = await db.products.get(id);
    expect(row!.serving_basis).toBe('100g');
    expect(row!.serving_unit).toBe(null);
  });

  it('isSupplement не указан → обычный продукт (food semantics)', async () => {
    const id = await createProduct({ name: 'Bread' });

    const row = await db.products.get(id);
    expect(row!.serving_basis).toBe('100g');
    expect(row!.serving_unit).toBe(null);
  });

  it('respects переданный id (optimistic UUID из upstream-флоу)', async () => {
    const customId = 'custom-uuid-1234';
    const returnedId = await createProduct({ id: customId, name: 'Apple' });

    expect(returnedId).toBe(customId);
    expect(await db.products.get(customId)).toBeDefined();
  });

  it('заполняет created_at ISO-строкой', async () => {
    const id = await createProduct({ name: 'Apple' });
    const row = await db.products.get(id);
    expect(typeof row!.created_at).toBe('string');
    // ISO 8601 — date-fns / new Date().toISOString() формат.
    expect(row!.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('инициализирует пустые nutrients / portions / categories', async () => {
    const id = await createProduct({ name: 'Apple', isSupplement: true });
    const row = await db.products.get(id);
    expect(row!.nutrients).toEqual({});
    expect(row!.portions).toEqual([]);
    expect(row!.categories).toEqual([]);
  });
});
