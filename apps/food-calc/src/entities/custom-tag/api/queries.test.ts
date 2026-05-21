import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { db } from '@/shared/lib/dexie/schema';
import { upsertCustomTags } from './mutations';
import { useCustomTagsByProduct } from './queries';

// Regression-страховка: чипы выводятся в DetailsChips в том порядке, который
// отдаёт хук. Если кто-то заменит `localeCompare(_,_,'ru')` на FIFO/insertion
// — порядок в UI станет случайным (порядок вставки в Dexie), и юзер увидит
// хаотичный набор. Тест на одну строчку сортировки — оправданная инвестиция.
describe('useCustomTagsByProduct', () => {
  beforeEach(async () => {
    await db.custom_tags.clear();
  });

  it('возвращает теги в алфавитном порядке (ru locale)', async () => {
    // Вставляем в нарочно random'ом порядке.
    await upsertCustomTags('prod-1', ['ягоды', 'без соли', 'острое', 'варёное']);

    const { result } = renderHook(() => useCustomTagsByProduct('prod-1'));

    // useLiveQuery возвращает [] на первом тике, потом массив. Ждём пока
    // данные подъедут.
    await waitFor(() => {
      expect(result.current.length).toBe(4);
    });

    expect(result.current.map((t) => t.tag)).toEqual([
      'без соли',
      'варёное',
      'острое',
      'ягоды',
    ]);
  });

  it('null/undefined productId → пустой массив (без падений)', async () => {
    // В custom_tags заведомо есть строка для другого продукта — чтобы
    // удостовериться, что хук с null/undefined НЕ дотягивает её.
    await upsertCustomTags('other-prod', ['ягоды']);

    const { result: r1 } = renderHook(() => useCustomTagsByProduct(null));
    const { result: r2 } = renderHook(() => useCustomTagsByProduct(undefined));

    // useLiveQuery на первом тике может вернуть `[]` (initial loading), а не
    // финальный результат. waitFor дожидается стабильного состояния — иначе
    // если кто-то поменяет хук на возврат `null` для loading, тест останется
    // зелёным, а продакшен упадёт на `.map`.
    await waitFor(() => {
      expect(r1.current).toEqual([]);
      expect(r2.current).toEqual([]);
    });
  });
});
