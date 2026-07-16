import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/shared/lib/dexie/schema';
import { addScheduleFood } from '@/entities/schedule-food/api/mutations';
import { addDishItem } from '@/entities/dish/api/mutations';
import { useAuthStore } from '@/features/auth/auth-store';
import {
  countDismissed,
  countTotal,
  selectCommittable,
  type CommittedItem,
} from '../selectCommittable';

// Tests for the mutation block of useWriteFoodFlow.commit().
//
// Scope: the loop+transaction that turns a CommittedItem[] into real Dexie
// rows (schedule_foods or dish_items). The loop body mirrors the schedule
// and dish branches of `commit` in useWriteFoodFlow.ts.

const USER_ID = '11111111-1111-1111-1111-111111111111';

// Ряд, указывающий на ПРОДУКТ. Ряд может указывать и на блюдо (юзер выбрал его
// вручную через поиск из предложки) — тогда `type: 'dish'` + `dishId`.
const foodItem = (
  productId: string,
  quantity: number,
  time: string,
  details = '',
): CommittedItem => ({ type: 'food', productId, dishId: null, quantity, time, details });

beforeAll(() => {
  useAuthStore.setState({ userId: USER_ID });
});

beforeEach(async () => {
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) await t.clear();
  });
});

afterEach(async () => {
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) await t.clear();
  });
});

// Mirrors the schedule branch of useWriteFoodFlow.commit().
async function commitScheduleItems(
  committed: CommittedItem[],
  date: string,
): Promise<string[]> {
  const newScheduleIds: string[] = [];
  await db.transaction('rw', db.schedule_foods, async () => {
    for (const c of committed) {
      const id = await addScheduleFood({
        date,
        time: c.time,
        type: c.type,
        quantity: c.quantity,
        productId: c.productId,
        dishId: c.dishId,
        details: c.details ?? '',
      });
      newScheduleIds.push(id);
    }
  });
  return newScheduleIds;
}

async function commitDishItems(
  committed: CommittedItem[],
  dishId: string,
): Promise<void> {
  await db.transaction('rw', db.dish_items, async () => {
    for (const c of committed) {
      // Mirror production: ингредиент блюда — всегда продукт.
      if (c.type !== 'food' || !c.productId) continue;
      await addDishItem({
        dishId,
        productId: c.productId,
        quantity: c.quantity,
        // Mirror production: head-A details (борщ→свекла «вареная») must persist.
        details: c.details ?? '',
      });
    }
  });
}

describe('useWriteFoodFlow.commit — schedule mode', () => {
  it('persists every committed item with correct fields', async () => {
    const date = '02-05-2026';
    const committed: CommittedItem[] = [
      foodItem('p-a', 100, '08:00'),
      foodItem('p-b', 250, '13:00', 'обед'),
      foodItem('p-c', 50, '21:00'),
    ];

    const ids = await commitScheduleItems(committed, date);

    expect(ids).toHaveLength(3);
    const rows = await db.schedule_foods.toArray();
    expect(rows).toHaveLength(3);

    for (const c of committed) {
      const row = rows.find((r) => r.product_id === c.productId);
      expect(row, `no row for productId ${c.productId}`).toBeTruthy();
      expect(row!.date).toBe(date);
      expect(row!.time).toBe(c.time);
      expect(row!.type).toBe('food');
      expect(row!.quantity).toBe(c.quantity);
      expect(row!.details).toBe(c.details);
      expect(row!.dish_id).toBeNull();
    }
  });

  it('rolls back atomically when an addScheduleFood throws mid-loop', async () => {
    const date = '02-05-2026';
    const committed: CommittedItem[] = [
      foodItem('p-a', 100, '08:00'),
      foodItem('', 100, '09:00'),
      foodItem('p-c', 100, '10:00'),
    ];

    let threw = false;
    try {
      await db.transaction('rw', db.schedule_foods, async () => {
        for (let i = 0; i < committed.length; i++) {
          const c = committed[i];
          await addScheduleFood({
            date,
            time: c.time,
            type: 'food',
            quantity: c.quantity,
            productId: i === 1 ? null : c.productId,
            details: c.details ?? '',
          });
        }
      });
    } catch {
      threw = true;
    }

    expect(threw, 'transaction must throw when addScheduleFood throws').toBe(true);

    const rows = await db.schedule_foods.toArray();
    expect(rows, 'all writes must roll back atomically').toHaveLength(0);
  });

  it('handles a single-item commit', async () => {
    const date = '02-05-2026';
    const committed: CommittedItem[] = [foodItem('only', 42, '12:00', 'solo')];

    const ids = await commitScheduleItems(committed, date);
    expect(ids).toHaveLength(1);
    const row = await db.schedule_foods.get(ids[0]);
    expect(row).toBeTruthy();
    expect(row!.product_id).toBe('only');
    expect(row!.quantity).toBe(42);
    expect(row!.details).toBe('solo');
  });

  it('returns the generated ids in commit order', async () => {
    const date = '02-05-2026';
    const committed: CommittedItem[] = [
      foodItem('p-a', 100, '08:00'),
      foodItem('p-b', 100, '09:00'),
    ];

    const ids = await commitScheduleItems(committed, date);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);

    const r0 = await db.schedule_foods.get(ids[0]);
    const r1 = await db.schedule_foods.get(ids[1]);
    expect(r0!.product_id).toBe('p-a');
    expect(r1!.product_id).toBe('p-b');
  });
});

describe('useWriteFoodFlow.commit — dish mode', () => {
  it('persists every committed item as a dish_item', async () => {
    const dishId = 'dish-xyz';
    const committed: CommittedItem[] = [
      foodItem('p-a', 100, '00:00'),
      foodItem('p-b', 200, '00:00', 'вареная'),
    ];

    await commitDishItems(committed, dishId);

    const rows = await db.dish_items.toArray();
    expect(rows).toHaveLength(2);
    for (const c of committed) {
      const row = rows.find((r) => r.product_id === c.productId);
      expect(row).toBeTruthy();
      expect(row!.dish_id).toBe(dishId);
      expect(row!.quantity).toBe(c.quantity);
      // head-A details must round-trip onto the dish_item (regression guard
      // for the dish-commit details passthrough in useWriteFoodFlow.commit).
      expect(row!.details).toBe(c.details);
    }
  });

  it('rolls back dish_items atomically on mid-loop error', async () => {
    const dishId = 'dish-xyz';
    const committed: CommittedItem[] = [
      foodItem('p-a', 100, '00:00'),
      foodItem('p-b', 200, '00:00'),
    ];

    let threw = false;
    try {
      await db.transaction('rw', db.dish_items, async () => {
        await addDishItem({
          dishId,
          productId: committed[0].productId!,
          quantity: committed[0].quantity,
        });
        // Synthetic mid-loop failure mirrors a thrown addDishItem.
        throw new Error('synthetic mid-loop failure');
      });
    } catch {
      threw = true;
    }

    expect(threw).toBe(true);
    const rows = await db.dish_items.toArray();
    expect(rows, 'first dish_item must be rolled back').toHaveLength(0);
  });
});

// Тестируем РЕАЛЬНУЮ функцию `selectCommittable` из './selectCommittable'.
// Раньше тут была inline-копия логики — она расходилась с источником
// (новый `u.enabled` гейт для soft-delete на unresolved не валидировался).
describe('useWriteFoodFlow.commit — committed[] filter (selectCommittable)', () => {
  it('drops disabled resolved rows', () => {
    const committed = selectCommittable({
      resolved: [
        { enabled: true, productId: 'a', quantity: 1, time: '08:00', details: '' },
        { enabled: false, productId: 'b', quantity: 1, time: '08:00', details: '' },
      ],
      ambiguous: [],
      unresolved: [],
    });
    expect(committed.map((c) => c.productId)).toEqual(['a']);
  });

  it('drops ambiguous rows with null/empty selectedId', () => {
    const committed = selectCommittable({
      resolved: [],
      ambiguous: [
        { enabled: true, selectedId: 'x', quantity: 1, time: '08:00', details: '' },
        { enabled: true, selectedId: null, quantity: 1, time: '08:00', details: '' },
        { enabled: true, selectedId: '', quantity: 1, time: '08:00', details: '' },
        { enabled: false, selectedId: 'y', quantity: 1, time: '08:00', details: '' },
      ],
      unresolved: [],
    });
    expect(committed.map((c) => c.productId)).toEqual(['x']);
  });

  it('drops unresolved rows without manual selection or with empty manual.id', () => {
    const committed = selectCommittable({
      resolved: [],
      ambiguous: [],
      unresolved: [
        { enabled: true, manual: { id: 'm1' }, quantity: 1, time: '08:00', details: '' },
        { enabled: true, manual: null, quantity: 1, time: '08:00', details: '' },
        { enabled: true, manual: { id: '' }, quantity: 1, time: '08:00', details: '' },
      ],
    });
    expect(committed.map((c) => c.productId)).toEqual(['m1']);
  });

  it('drops soft-deleted unresolved rows even with a valid manual', () => {
    // Inline-undo на HomePage: юзер вручную привязал unresolved → manual.id
    // выставлен, но потом dismiss'нул ряд крестиком → enabled=false. Должен
    // выпасть из committed. Регрессионный тест: до extract'а тут был
    // антипаттерн — inline-копия фильтра НЕ проверяла `u.enabled`, и откат
    // `&& u.enabled` в источнике прошёл бы незамеченным.
    const committed = selectCommittable({
      resolved: [],
      ambiguous: [],
      unresolved: [
        { enabled: false, manual: { id: 'm1' }, quantity: 1, time: '08:00', details: '' },
      ],
    });
    expect(committed).toHaveLength(0);
  });

  it('combines all three categories preserving order resolved → ambiguous → unresolved', () => {
    const committed: CommittedItem[] = selectCommittable({
      resolved: [{ enabled: true, productId: 'r1', quantity: 1, time: '08:00', details: '' }],
      ambiguous: [{ enabled: true, selectedId: 'a1', quantity: 1, time: '08:00', details: '' }],
      unresolved: [
        { enabled: true, manual: { id: 'u1' }, quantity: 1, time: '08:00', details: '' },
      ],
    });
    expect(committed.map((c) => c.productId)).toEqual(['r1', 'a1', 'u1']);
  });

  // Ручной выбор из поиска (`choice`) перебивает выбор матчера в ЛЮБОЙ категории —
  // и он единственный умеет ссылаться на БЛЮДО (матчер блюда не подбирает).
  it('choice перебивает выбор матчера', () => {
    const committed = selectCommittable({
      resolved: [
        {
          enabled: true,
          productId: 'matcher-pick',
          choice: { variant: 'product', productId: 'user-pick', dishId: null, name: 'Творог' },
          quantity: 1,
          time: '08:00',
          details: '',
        },
      ],
      ambiguous: [],
      unresolved: [],
    });
    expect(committed).toEqual([
      { type: 'food', productId: 'user-pick', dishId: null, quantity: 1, time: '08:00', details: '' },
    ]);
  });

  it('ряд с выбранным БЛЮДОМ коммитится как type dish', () => {
    const committed = selectCommittable({
      resolved: [],
      ambiguous: [],
      unresolved: [
        {
          enabled: true,
          manual: null,
          choice: { variant: 'dish', productId: null, dishId: 'd-1', name: 'Борщ' },
          quantity: 300,
          time: '13:00',
          details: '',
        },
      ],
    });
    expect(committed).toEqual([
      { type: 'dish', productId: null, dishId: 'd-1', quantity: 300, time: '13:00', details: '' },
    ]);
  });

  it('choice без id (еда не выбрана) не коммитится', () => {
    const committed = selectCommittable({
      resolved: [],
      ambiguous: [],
      unresolved: [
        {
          enabled: true,
          manual: { id: 'm1' },
          choice: { variant: 'dish', productId: null, dishId: null, name: '' },
          quantity: 1,
          time: '08:00',
          details: '',
        },
      ],
    });
    expect(committed).toHaveLength(0);
  });

  it('returns [] when every row is dismissed — commit() must early-return', () => {

    // Critical для UI-логики: при `totalToAdd === 0` CTA «Добавить N» становится
    // disabled («Нечего добавлять»). Если фильтр перестанет учитывать
    // `enabled === false` хоть в одной из категорий — отдельные dismissed
    // ряды утекут в `addScheduleFood`/`addDishItem`, и `commit()` запишет в
    // Dexie то, что юзер ВЫЧЕРКНУЛ.
    const committed = selectCommittable({
      resolved: [
        { enabled: false, productId: 'r1', quantity: 1, time: '08:00', details: '' },
      ],
      ambiguous: [
        { enabled: false, selectedId: 'a1', quantity: 1, time: '08:00', details: '' },
      ],
      unresolved: [
        { enabled: false, manual: { id: 'u1' }, quantity: 1, time: '08:00', details: '' },
      ],
    });
    expect(committed).toEqual([]);
  });
});

// Telemetry-счётчики (buildTelemetry → itemsDeleted/itemsTotal). До extract'а
// они жили inline и не были покрыты регрессионным тестом — откат фильтра в
// useWriteFoodFlow.ts прошёл бы незамеченным (analytics показывала бы «0
// удалено» при soft-delete). Теперь обе функции pure → тестируем напрямую.
describe('telemetry counts — countDismissed / countTotal', () => {
  it('countDismissed суммирует !enabled во всех трёх категориях', () => {
    expect(
      countDismissed({
        resolved: [
          { enabled: true, productId: 'a', quantity: 1, time: '08:00', details: '' },
          { enabled: false, productId: 'b', quantity: 1, time: '08:00', details: '' },
        ],
        ambiguous: [
          { enabled: false, selectedId: 'x', quantity: 1, time: '08:00', details: '' },
        ],
        unresolved: [
          { enabled: true, manual: null, quantity: 1, time: '08:00', details: '' },
          { enabled: false, manual: { id: 'u1' }, quantity: 1, time: '08:00', details: '' },
        ],
      }),
    ).toBe(3);
  });

  it('countDismissed = 0 когда ничего не dismiss’нуто', () => {
    expect(
      countDismissed({
        resolved: [
          { enabled: true, productId: 'a', quantity: 1, time: '08:00', details: '' },
        ],
        ambiguous: [],
        unresolved: [],
      }),
    ).toBe(0);
  });

  it('countTotal суммирует ВСЕ ряды (включая dismissed)', () => {
    expect(
      countTotal({
        resolved: [
          { enabled: true, productId: 'a', quantity: 1, time: '08:00', details: '' },
          { enabled: false, productId: 'b', quantity: 1, time: '08:00', details: '' },
        ],
        ambiguous: [
          { enabled: true, selectedId: 'x', quantity: 1, time: '08:00', details: '' },
        ],
        unresolved: [
          { enabled: false, manual: null, quantity: 1, time: '08:00', details: '' },
        ],
      }),
    ).toBe(4);
  });

  it('countTotal = 0 на пустом input', () => {
    expect(countTotal({ resolved: [], ambiguous: [], unresolved: [] })).toBe(0);
  });
});
