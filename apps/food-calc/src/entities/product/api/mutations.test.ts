import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/shared/lib/dexie/schema';
import { createProduct, updateProduct } from './mutations';

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

  it('description по умолчанию пустая строка', async () => {
    const id = await createProduct({ name: 'Apple' });
    const row = await db.products.get(id);
    expect(row!.description).toBe('');
  });

  it('прокидывает переданную description', async () => {
    const id = await createProduct({ name: 'Apple', description: 'сорт Гала' });
    const row = await db.products.get(id);
    expect(row!.description).toBe('сорт Гала');
  });
});

// Единственный живой путь ПРАВКИ описания продукта (ProductDrawer →
// ChangeDescriptionModal → updateProduct). Контракт: description — plain-колонка
// (COLUMN_MAP, вне JSON_FIELDS), пустая строка = валидное «стереть».
describe('updateProduct — description (plain column)', () => {
  beforeEach(async () => {
    await db.products.clear();
  });

  it('записывает новое значение, не трогая соседние поля', async () => {
    const id = await createProduct({ name: 'Apple', description: 'старое' });
    await updateProduct(id, { description: 'сорт Гала' });
    const row = await db.products.get(id);
    expect(row!.description).toBe('сорт Гала');
    expect(row!.name).toBe('Apple');
    expect(row!.nutrients).toEqual({});
  });

  it('пустая строка СТИРАЕТ описание (в отличие от имени, пусто валидно)', async () => {
    const id = await createProduct({ name: 'Apple', description: 'сорт Гала' });
    await updateProduct(id, { description: '' });
    const row = await db.products.get(id);
    expect(row!.description).toBe('');
  });

  it('JSON-подобный текст хранится литеральной строкой, НЕ парсится (не JSON_FIELDS)', async () => {
    const id = await createProduct({ name: 'Apple' });
    await updateProduct(id, { description: '{"note":"json-like"}' });
    const row = await db.products.get(id);
    expect(row!.description).toBe('{"note":"json-like"}');
    expect(typeof row!.description).toBe('string');
  });
});
