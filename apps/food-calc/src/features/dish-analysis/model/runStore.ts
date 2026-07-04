import { create } from 'zustand';
import { runDishAnalysis, type DishAnalysisResult } from '../api/runDishAnalysis';

// Module-scope запуск разбора блюда, keyed by dishId. Живёт ВНЕ дерева модалки,
// поэтому переживает её закрытие/переоткрытие и смену роута (2026-07-04). Причина:
// `modalStore.show` фиксит props на момент открытия, а прежний DishAnalysisScreen
// абортил in-flight на unmount → закрытие модалки теряло бы прогресс И оставляло
// списанную оплату без сохранённого результата.
//
// Ключевые инварианты:
//   • запуск БЕЗ AbortSignal — никогда не абортим (оплата уже списана, результат
//     персистится внутри runDishAnalysis);
//   • `start` идемпотентен: повторный вызов при `loading` — no-op (один POST, без
//     двойного charge).

export type DishRun = {
  status: 'loading' | 'done' | 'error';
  result?: DishAnalysisResult;
  error?: string;
};

type RunStore = {
  runs: Record<string, DishRun | undefined>;
  start: (dishId: string) => Promise<void>;
  clear: (dishId: string) => void;
};

export const useDishRunStore = create<RunStore>((set, get) => ({
  runs: {},
  start: async (dishId) => {
    // Идемпотентность: если разбор уже идёт — не запускаем второй POST.
    if (get().runs[dishId]?.status === 'loading') return;
    set((s) => ({ runs: { ...s.runs, [dishId]: { status: 'loading' } } }));
    try {
      // Без signal: запрос доводится до конца даже если модалка закрыта.
      const result = await runDishAnalysis({ dishId });
      set((s) => ({ runs: { ...s.runs, [dishId]: { status: 'done', result } } }));
    } catch (e) {
      // PaymentRequiredError extends Error → сообщение о балансе едет через .message.
      const error = e instanceof Error ? e.message : String(e);
      set((s) => ({ runs: { ...s.runs, [dishId]: { status: 'error', error } } }));
    }
  },
  clear: (dishId) =>
    set((s) => {
      const next = { ...s.runs };
      delete next[dishId];
      return { runs: next };
    }),
}));

/** Селектор-хук: живой снимок запуска для конкретного блюда. */
export function useDishRun(dishId: string): DishRun | undefined {
  return useDishRunStore((s) => s.runs[dishId]);
}
