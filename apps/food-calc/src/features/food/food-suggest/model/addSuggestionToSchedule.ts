import { addScheduleFood } from '@/entities/schedule-food';
import { markAdded } from '@/shared/model/recentlyAddedStore';
import { safeMutate } from '@/shared/lib/safeMutate';
import type { Suggestion } from '@/shared/lib/suggest';

export type SuggestSelectPayload = {
  variant: 'product' | 'dish';
  id: string;
  name: string;
  /** Реалистичная порция из скоринга (resolvePortion) — дефолт-количество ряда. */
  portionGrams: number;
};

/**
 * Добавление предложения в рацион напрямую (без шага «Порция»): количество =
 * реалистичная порция из скоринга, время = «сейчас» — зеркало create-ветки
 * useFoodEntryFlow.handleCommit. markAdded ДО записи, иначе liveQuery смонтирует
 * ряд раньше флага и проиграет быстрый stagger вместо появления.
 *
 * Это дефолтный обработчик тапа по ряду предложки. Шаг 5 (вход из
 * NutrientsDrawer) может передать свой onSelectFood и провести выбор через
 * полный food-entry-флоу — логика порций при этом не дублируется: порция
 * приезжает в payload.
 */
export function addSuggestionToSchedule(date: string, suggestion: Suggestion): void {
  const newId = crypto.randomUUID();
  markAdded([newId]);
  void safeMutate(
    () =>
      addScheduleFood({
        id: newId,
        date,
        time: new Date().toTimeString().slice(0, 5),
        type: suggestion.ref.kind === 'product' ? 'food' : 'dish',
        productId: suggestion.ref.kind === 'product' ? suggestion.ref.id : null,
        dishId: suggestion.ref.kind === 'dish' ? suggestion.ref.id : null,
        quantity: suggestion.portionGrams,
        details: null,
      }),
    'Не удалось добавить в расписание',
  );
}
