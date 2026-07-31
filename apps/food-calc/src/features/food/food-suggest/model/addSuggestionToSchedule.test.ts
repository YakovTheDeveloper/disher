import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { waitFor } from '@testing-library/react';
import { db, type ScheduleFoodRow } from '@/shared/lib/dexie/schema';
import { isJustAdded } from '@/shared/model/recentlyAddedStore';
import type { Suggestion } from '@/shared/lib/suggest';
import { addSuggestionToSchedule } from './addSuggestionToSchedule';

const makeSuggestion = (overrides: Partial<Suggestion> & Pick<Suggestion, 'ref'>): Suggestion => ({
  portionGrams: 150,
  score: 80,
  topCovers: [],
  nutrients: {},
  ...overrides,
});

// Dexie-интеграция (fake-indexeddb): запись предложения в расписание.
describe('addSuggestionToSchedule', () => {
  it('продукт → type food, quantity = portionGrams, запись в переданную дату, markAdded до записи', async () => {
    addSuggestionToSchedule(
      '2026-08-01',
      makeSuggestion({ ref: { kind: 'product', id: 'prod-x', name: 'Грудка' }, portionGrams: 150 }),
    );

    let row: ScheduleFoodRow | undefined;
    await waitFor(async () => {
      row = (await db.schedule_foods.toArray()).find((r) => r.product_id === 'prod-x');
      expect(row).toBeTruthy();
    });

    expect(row!.type).toBe('food');
    expect(row!.quantity).toBe(150);
    expect(row!.date).toBe('2026-08-01');
    expect(row!.dish_id).toBeNull();
    // Флаг «только что добавлен» поставлен ДО записи (иначе liveQuery
    // смонтирует ряд раньше флага) — на момент появления строки он уже есть.
    expect(isJustAdded(row!.id)).toBe(true);
  });

  it('блюдо → type dish с dishId, productId пуст', async () => {
    addSuggestionToSchedule(
      '2026-08-02',
      makeSuggestion({ ref: { kind: 'dish', id: 'dish-x', name: 'Салат' }, portionGrams: 350 }),
    );

    let row: ScheduleFoodRow | undefined;
    await waitFor(async () => {
      row = (await db.schedule_foods.toArray()).find((r) => r.dish_id === 'dish-x');
      expect(row).toBeTruthy();
    });

    expect(row!.type).toBe('dish');
    expect(row!.quantity).toBe(350);
    expect(row!.date).toBe('2026-08-02');
    expect(row!.product_id).toBeNull();
    expect(isJustAdded(row!.id)).toBe(true);
  });
});
