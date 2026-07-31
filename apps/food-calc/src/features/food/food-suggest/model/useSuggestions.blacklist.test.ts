import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/shared/lib/dexie/schema';
import { putRow } from '@/shared/lib/dexie/write';
import { DEFAULT_NORM_ITEMS } from '@/entities/daily-norm';
import { addToBlacklist, removeFromBlacklist } from '@/entities/product-blacklist';
import { useSuggestions } from './useSuggestions';

// Интеграционный тест реактивности blacklist на реальных хуках (fake-indexeddb):
// бан убирает продукт из выдачи, разбан возвращает — без перезагрузки модалки.
//
// Тестовый продукт — «идеальный»: нутриенты на 100 г ровно равны дефолтным
// нормам (порция 100 г, перебора нет) → score 100 и гарантированное место
// в топ-20 среди ~715 продуктов каталога.
const PRODUCT_ID = 'prod-blacklist-reactivity';

async function seedPerfectProduct(): Promise<void> {
  await putRow(db.products, {
    id: PRODUCT_ID,
    name: 'Идеальный продукт',
    source: 'user',
    nutrients: { ...DEFAULT_NORM_ITEMS },
    portions: [{ label: 'порция', grams: 100 }],
    categories: [],
    serving_basis: '100g',
    serving_unit: null,
    description: '',
    created_at: '2026-01-01T00:00:00.000Z',
  });
}

const suggestedIds = (result: { current: ReturnType<typeof useSuggestions> }) =>
  result.current.suggestions.map((s) => s.ref.id);

describe('useSuggestions — реактивность blacklist (интеграция, fake-indexeddb)', () => {
  it('addToBlacklist → продукт пропадает; removeFromBlacklist → возвращается', async () => {
    await seedPerfectProduct();

    const { result } = renderHook(() => useSuggestions('2026-08-01'));

    // Дождались загрузки всех входов — продукт в выдаче.
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(suggestedIds(result)).toContain(PRODUCT_ID));

    await addToBlacklist(PRODUCT_ID);
    await waitFor(() => expect(suggestedIds(result)).not.toContain(PRODUCT_ID));

    await removeFromBlacklist(PRODUCT_ID);
    await waitFor(() => expect(suggestedIds(result)).toContain(PRODUCT_ID));
  }, 20000);
});
