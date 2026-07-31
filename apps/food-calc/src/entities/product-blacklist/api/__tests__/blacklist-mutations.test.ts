import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/shared/lib/dexie/schema';
import { putRow } from '@/shared/lib/dexie/write';
import { addToBlacklist, removeFromBlacklist } from '../mutations';

// Dexie-интеграция (fake-indexeddb): контракт бана/разбана по product_id.
// Таблицу между тестами не чистим — id продуктов уникальны на тест.
describe('product-blacklist mutations', () => {
  it('addToBlacklist идемпотентен: повторный бан не плодит дубли', async () => {
    await addToBlacklist('prod-idem');
    await addToBlacklist('prod-idem');

    const rows = await db.product_blacklist.where('product_id').equals('prod-idem').toArray();
    expect(rows).toHaveLength(1);
  });

  it('removeFromBlacklist(productId) снимает ВСЕ дубли продукта + tombstone на каждый', async () => {
    // Дубли одного product_id конвергируют с двух устройств (натуральный ключ
    // не дедупится LWW, И-12) — разбан обязан снять их разом, иначе продукт
    // остаётся скрытым выжившей строкой.
    for (const id of ['ban-dup-1', 'ban-dup-2']) {
      await putRow(db.product_blacklist, {
        id,
        product_id: 'prod-dup',
        created_at: '2026-01-01T00:00:00.000Z',
      });
    }
    await putRow(db.product_blacklist, {
      id: 'ban-dup-other',
      product_id: 'prod-dup-neighbour',
      created_at: '2026-01-01T00:00:00.000Z',
    });

    await removeFromBlacklist('prod-dup');

    expect(await db.product_blacklist.where('product_id').equals('prod-dup').toArray()).toEqual([]);
    // Чужой продукт не задет.
    expect(
      await db.product_blacklist.where('product_id').equals('prod-dup-neighbour').toArray(),
    ).toHaveLength(1);

    const tombstones = await db.tombstones.toArray();
    for (const id of ['ban-dup-1', 'ban-dup-2']) {
      expect(tombstones.some((t) => t.id === id && t.table === 'product_blacklist')).toBe(true);
    }
  });

  it('removeFromBlacklist по несуществующему product_id — no-op, без новых tombstone', async () => {
    const before = (await db.tombstones.toArray()).length;
    await removeFromBlacklist('prod-absent');
    expect((await db.tombstones.toArray()).length).toBe(before);
  });
});
