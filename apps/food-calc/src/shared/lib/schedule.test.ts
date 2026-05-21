import { describe, it, expect } from 'vitest';
import { groupItemsByTime } from './schedule';

type Item = { id: string; time: string };

describe('groupItemsByTime', () => {
  it('склеивает соседей с gap ≤ 15 мин и не склеивает с gap > 15', () => {
    // 9:00 → 9:14 (gap 14) — склей. 9:14 → 9:29 (gap 15) — склей.
    // 9:29 → 9:45 (gap 16) — НЕ склей.
    const items: Item[] = [
      { id: 'a', time: '09:00' },
      { id: 'b', time: '09:14' },
      { id: 'c', time: '09:29' },
      { id: 'd', time: '09:45' },
    ];

    const groups = groupItemsByTime(items);

    expect(groups).toHaveLength(2);
    expect(groups[0].startTime).toBe('09:00');
    expect(groups[0].endTime).toBe('09:29');
    expect(groups[0].items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(groups[1].startTime).toBe('09:45');
    expect(groups[1].endTime).toBe('09:45');
    expect(groups[1].items.map((i) => i.id)).toEqual(['d']);
    // offset второй группы = 9:45 - 9:29 = 16 мин
    expect(groups[1].offset).toEqual({ hours: 0, minutes: 16 });
  });

  it('chain drift: цепочка 9:00→9:13→9:26→9:39 — один кластер 9:00–9:39', () => {
    // Каждая соседняя пара ≤ 15, поэтому single-linkage склеивает всю цепь
    // в один кластер 39 минут шириной. Документирует намеренное поведение —
    // не вводить max-span без обсуждения.
    const items: Item[] = [
      { id: 'a', time: '09:00' },
      { id: 'b', time: '09:13' },
      { id: 'c', time: '09:26' },
      { id: 'd', time: '09:39' },
    ];

    const groups = groupItemsByTime(items);

    expect(groups).toHaveLength(1);
    expect(groups[0].startTime).toBe('09:00');
    expect(groups[0].endTime).toBe('09:39');
    expect(groups[0].items).toHaveLength(4);
  });

  it('offset через час корректно раскладывается на hours/minutes', () => {
    // 10:50 → 12:05, gap = 75 мин = 1ч 15м
    const items: Item[] = [
      { id: 'a', time: '10:50' },
      { id: 'b', time: '12:05' },
    ];

    const groups = groupItemsByTime(items);

    expect(groups).toHaveLength(2);
    expect(groups[1].offset).toEqual({ hours: 1, minutes: 15 });
  });

  it('exact-tie merge: два item с одинаковым time = один кластер span=0', () => {
    const items: Item[] = [
      { id: 'a', time: '09:00' },
      { id: 'b', time: '09:00' },
    ];

    const groups = groupItemsByTime(items);

    expect(groups).toHaveLength(1);
    expect(groups[0].startTime).toBe('09:00');
    expect(groups[0].endTime).toBe('09:00');
    expect(groups[0].items).toHaveLength(2);
    expect(groups[0].offset).toBeNull();
  });

  it('несортированный input корректно сортируется перед кластеризацией', () => {
    // Подаём вперемешку. Алгоритм обязан отсортировать и кластеризовать
    // по реальному порядку времени, иначе chain-detection ломается.
    const items: Item[] = [
      { id: 'late', time: '12:00' },
      { id: 'first', time: '09:00' },
      { id: 'mid', time: '09:10' },
    ];

    const groups = groupItemsByTime(items);

    expect(groups).toHaveLength(2);
    expect(groups[0].startTime).toBe('09:00');
    expect(groups[0].endTime).toBe('09:10');
    expect(groups[0].items.map((i) => i.id)).toEqual(['first', 'mid']);
    expect(groups[1].startTime).toBe('12:00');
    expect(groups[1].items.map((i) => i.id)).toEqual(['late']);
  });
});
