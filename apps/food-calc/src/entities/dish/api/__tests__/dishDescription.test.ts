import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/shared/lib/dexie/schema';
import { createDish, updateDishDescription } from '../mutations';

async function clearAll() {
  await Promise.all(db.tables.map((t) => t.clear()));
}

describe('dish description', () => {
  beforeEach(clearAll);

  it('createDish → description по умолчанию пустая строка', async () => {
    const id = await createDish('Борщ');
    const row = await db.dishes.get(id);
    expect(row!.description).toBe('');
  });

  it('createDish прокидывает переданную description', async () => {
    const id = await createDish('Борщ', undefined, 'на говяжьем бульоне');
    const row = await db.dishes.get(id);
    expect(row!.description).toBe('на говяжьем бульоне');
  });

  it('updateDishDescription записывает новое значение', async () => {
    const id = await createDish('Борщ');
    await updateDishDescription(id, 'со сметаной');
    const row = await db.dishes.get(id);
    expect(row!.description).toBe('со сметаной');
  });

  it('updateDishDescription пустой строкой СТИРАЕТ описание', async () => {
    const id = await createDish('Борщ', undefined, 'со сметаной');
    await updateDishDescription(id, '');
    const row = await db.dishes.get(id);
    expect(row!.description).toBe('');
  });
});
