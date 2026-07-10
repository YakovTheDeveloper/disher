import { useMemo, type ReactNode } from 'react';
import { allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { useRichNutrientStore } from './model';

/**
 * Тайтл/мета хедера поиска для КОНСУМЕРА (FoodEntryCreateModals /
 * FreeTextFoodReviewEditModals). Хедер поиска теперь живёт ПРЯМЫМ ребёнком
 * <ModalShell> (симметрия с create/quantity), поэтому вычисление заголовка,
 * раньше сидевшее внутри SearchFood, поднято сюда.
 *
 * Правило (без изменений против прежнего внутреннего хедера): при активном
 * нутриент-фильтре имя нутриента ПЕРЕБИВАЕТ статичный тайтл хоста («Железо:»),
 * а дата-мета тогда нерелевантна (режим фильтра, не «еда в день») → прячется;
 * иначе — тайтл/мета хоста. Стор нутриента общий на все инстансы SearchFood,
 * так что консумер читает ровно то же значение, что рисует список.
 */
export function useSearchHeaderContent(
  baseTitle: ReactNode,
  baseTitleMeta?: ReactNode
): { title: ReactNode; titleMeta?: ReactNode } {
  const richNutrient = useRichNutrientStore((s) => s.richNutrient);
  const richNutrientName = useMemo(
    () =>
      richNutrient
        ? (allNutrientsList.find((n) => n.id === richNutrient.id)?.displayNameRu ?? null)
        : null,
    [richNutrient]
  );
  return {
    title: richNutrientName ? `${richNutrientName}:` : baseTitle,
    titleMeta: richNutrientName ? undefined : baseTitleMeta,
  };
}
