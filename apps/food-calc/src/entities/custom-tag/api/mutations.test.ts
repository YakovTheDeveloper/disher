import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/shared/lib/dexie/schema';
import { upsertCustomTags, removeCustomTag } from './mutations';

// Gone-если-fail регрессии: long-press → confirm → removeCustomTag — единственный
// способ удалить пользовательский тег из UI. Если compound-фильтр сломается
// (например, кто-то переедет на индекс `[product_id+tag]` без schema bump),
// удаление превратится в no-op и юзер не сможет почистить чипы.
describe('removeCustomTag', () => {
  beforeEach(async () => {
    await db.custom_tags.clear();
  });

  it('удаляет (productId, tag) из custom_tags', async () => {
    await upsertCustomTags('prod-1', ['варёное', 'с солью']);

    await removeCustomTag('prod-1', 'варёное');

    const remaining = await db.custom_tags.where('product_id').equals('prod-1').toArray();
    expect(remaining.map((r) => r.tag)).toEqual(['с солью']);
  });

  it('нормализует tag перед удалением (UI отдаёт display-форму)', async () => {
    await upsertCustomTags('prod-1', ['Варёное']);

    // В db лежит уже нормализованная строка ('варёное'). UI может передать
    // строку в любом регистре — мутация должна нормализовать сама.
    await removeCustomTag('prod-1', 'ВАРЁНОЕ');

    const remaining = await db.custom_tags.where('product_id').equals('prod-1').toArray();
    expect(remaining).toEqual([]);
  });

  it('не трогает теги других продуктов', async () => {
    await upsertCustomTags('prod-1', ['варёное']);
    await upsertCustomTags('prod-2', ['варёное']);

    await removeCustomTag('prod-1', 'варёное');

    const p1 = await db.custom_tags.where('product_id').equals('prod-1').toArray();
    const p2 = await db.custom_tags.where('product_id').equals('prod-2').toArray();
    expect(p1).toEqual([]);
    expect(p2.map((r) => r.tag)).toEqual(['варёное']);
  });

  it('idempotent — удаление несуществующего пары не падает', async () => {
    await expect(removeCustomTag('prod-1', 'never-was')).resolves.toBeUndefined();
  });

  it('no-op при пустом productId / пустом tag', async () => {
    await upsertCustomTags('prod-1', ['варёное']);

    await removeCustomTag('', 'варёное');
    await removeCustomTag('prod-1', '');
    await removeCustomTag('prod-1', '   ');

    const remaining = await db.custom_tags.where('product_id').equals('prod-1').toArray();
    expect(remaining.map((r) => r.tag)).toEqual(['варёное']);
  });
});
