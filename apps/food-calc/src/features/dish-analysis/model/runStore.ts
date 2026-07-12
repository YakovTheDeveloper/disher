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
  /** X-Request-Id for this attempt — carried on an errored run so a retry
   *  reuses it and the server dedups the 2 ₽ charge (dish has no cache). */
  requestId?: string;
};

type RunStore = {
  runs: Record<string, DishRun | undefined>;
  start: (dishId: string) => Promise<void>;
  clear: (dishId: string) => void;
};

export const useDishRunStore = create<RunStore>((set, get) => ({
  runs: {},
  start: async (dishId) => {
    const prev = get().runs[dishId];
    // Идемпотентность: если разбор уже идёт — не запускаем второй POST.
    if (prev?.status === 'loading') return;
    // Reuse the failed attempt's requestId so a retry of a lost-response run
    // dedups the charge server-side; a fresh run (or one after success) mints a
    // new key. crypto.randomUUID is available in every target (PWA/modern).
    const requestId =
      prev?.status === 'error' && prev.requestId ? prev.requestId : crypto.randomUUID();
    set((s) => ({ runs: { ...s.runs, [dishId]: { status: 'loading', requestId } } }));
    try {
      // Без signal: запрос доводится до конца даже если модалка закрыта.
      const result = await runDishAnalysis({ dishId, requestId });
      set((s) => ({ runs: { ...s.runs, [dishId]: { status: 'done', result } } }));
    } catch (e) {
      // PaymentRequiredError extends Error → сообщение о балансе едет через .message.
      const error = e instanceof Error ? e.message : String(e);
      set((s) => ({ runs: { ...s.runs, [dishId]: { status: 'error', error, requestId } } }));
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
