import { useMemo } from 'react';
import { useScheduleNutrientTotals } from '@/entities/schedule-food';
import { useUserNormItems, useHasUserNorm, DEFAULT_NORM_ITEMS } from '@/entities/daily-norm';
import { useProducts, useProductsLoading } from '@/entities/product';
import {
  useDishes,
  useDishItemsByDishIds,
  useDishPortionsByDishIds,
  useDishesLoading,
  useDishItemsLoading,
  useDishPortionsLoading,
} from '@/entities/dish';
import { useBlacklistedProductIds, useBlacklistLoading } from '@/entities/product-blacklist';
import { parseNutrients, parsePortions } from '@/shared/lib/parsers';
import {
  computeDeficits,
  scoreSuggestions,
  type Deficit,
  type SuggestCandidate,
  type Suggestion,
} from '@/shared/lib/suggest';

export type SuggestionsResult = {
  suggestions: Suggestion[];
  /** Дефицитов нет вообще — UI показывает «норма дня выполнена», а не список. */
  normComplete: boolean;
  /** Топ-3 дефицита дня (по относительному) — для подзаголовка модалки. */
  topDeficits: Deficit[];
  /** Сколько продуктов в blacklist — для empty-стейта «все скрыты юзером». */
  blacklistSize: number;
  hasUserNorm: boolean;
  /** Хоть один liveQuery-вход ещё на первом тике — не рисуем список на
   *  полупустых данных (см. гейт в теле хука). */
  isLoading: boolean;
};

const parseCategories = (json: string | null | undefined): string[] => {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
};

const TOP_DEFICITS_LIMIT = 3;

const EMPTY_RESULT: Omit<SuggestionsResult, 'blacklistSize' | 'hasUserNorm'> = {
  suggestions: [],
  normComplete: false,
  topDeficits: [],
  isLoading: true,
};

/**
 * Хук-оркестратор предложки «Что доесть?» (шаг 4 плана
 * tds/task_spec/ЧтоЕщеСъесть.md): тоталы дня + норма (юзерская ?? дефолт) →
 * дефициты → кандидаты (все продукты каталога+юзерские + блюда) → скоринг.
 *
 * ЯКОРЬ: blacklist действует ТОЛЬКО на предложку. В SearchFood и уже
 * запланированных приёмах забаненный продукт остаётся видимым — осознанное
 * решение (иначе сломалось бы отображение истории), см. шаг 5.3 плана.
 *
 * ЯКОРЬ: blacklist фильтрует ТОЛЬКО продуктовых кандидатов — блюдо с
 * забаненным ингредиентом остаётся в выдаче. Осознанное решение (ревью
 * 2026-07-31): dish-blacklist — отдельная фича, не v1; зафиксировано в
 * оговорках спеки.
 */
export function useSuggestions(date: string): SuggestionsResult {
  const { totals, isLoading: totalsLoading } = useScheduleNutrientTotals(date);
  const userNormItems = useUserNormItems();
  const hasUserNorm = useHasUserNorm();
  const products = useProducts();
  const dishes = useDishes();
  const blacklist = useBlacklistedProductIds();

  const dishIds = useMemo(() => dishes.map((d) => d.id), [dishes]);
  const dishItems = useDishItemsByDishIds(dishIds);
  const dishPortions = useDishPortionsByDishIds(dishIds);

  // Гейт первого тика: isLoading ждёт ВСЕ liveQuery-входы (тоталы расписания,
  // нормы, продукты, блюда, dish_items, dish_portions, blacklist) — ни один
  // undefined не должен коалесцировать в [] до загрузки, иначе первый рендер
  // показывает список, посчитанный на полупустых данных (ревью 2026-07-31).
  const productsLoading = useProductsLoading();
  const dishesLoading = useDishesLoading();
  const dishItemsLoading = useDishItemsLoading();
  const dishPortionsLoading = useDishPortionsLoading();
  const blacklistLoading = useBlacklistLoading();
  const isLoading =
    userNormItems === undefined ||
    totalsLoading ||
    productsLoading ||
    dishesLoading ||
    dishItemsLoading ||
    dishPortionsLoading ||
    blacklistLoading;

  // undefined = норма ещё грузится из IDB; null = ряда нет (мастер не пройден) →
  // дефолтные нормы, список всё равно считаем (план, шаг 4, empty-стейты).
  return useMemo(() => {
    if (isLoading) {
      return {
        ...EMPTY_RESULT,
        blacklistSize: blacklist.size,
        hasUserNorm,
      };
    }
    // Пустой объект норм (dev-reset пишет {} как «нормы нет») эквивалентен
    // отсутствию ряда — считаем по дефолтным (зеркало useHasUserNorm).
    const norms =
      userNormItems && Object.keys(userNormItems).length > 0
        ? userNormItems
        : DEFAULT_NORM_ITEMS;
    const deficits = computeDeficits(totals, norms);

    // Нутриенты продуктов на 100 г — разделяемая карта: нужна и кандидатам-
    // продуктам, и развёртке блюд (items → productNutrients).
    const productNutrients = new Map<string, Record<string, number>>();
    for (const p of products) {
      const entries = parseNutrients(p.nutrients);
      if (entries.length > 0) {
        productNutrients.set(
          p.id,
          Object.fromEntries(entries.map((e) => [e.nutrientId, e.quantity])),
        );
      }
    }

    const candidates: SuggestCandidate[] = [];
    for (const p of products) {
      candidates.push({
        kind: 'product',
        id: p.id,
        name: p.name,
        categories: parseCategories(p.categories),
        portions: parsePortions(p.portions),
        servingBasis: p.servingBasis,
        // Юнит дозы БАД протягиваем в suggestion — ряду не нужен per-row
        // useProduct (20 рядов × liveQuery по полному каталогу).
        servingUnit: p.servingUnit,
        nutrients: productNutrients.get(p.id) ?? {},
      });
    }
    for (const d of dishes) {
      const items = dishItems
        .filter((item) => item.dishId === d.id)
        .map((item) => ({ productId: item.productId, quantity: item.quantity }));
      if (items.length === 0) continue;
      candidates.push({
        kind: 'dish',
        id: d.id,
        name: d.name,
        // Именованные порции блюда (dish_portions) — resolvePortion берёт
        // первую; без них порция блюда — фолбэк 100 г.
        portions: dishPortions
          .filter((portion) => portion.dishId === d.id)
          .map((portion) => ({ grams: portion.grams })),
        items,
        productNutrients,
      });
    }

    const { suggestions, normComplete } = scoreSuggestions(candidates, deficits, {
      blacklist,
    });

    return {
      suggestions,
      normComplete,
      topDeficits: deficits
        .filter((d) => d.deficit > 0)
        .sort((a, b) => b.relDeficit - a.relDeficit)
        .slice(0, TOP_DEFICITS_LIMIT),
      blacklistSize: blacklist.size,
      hasUserNorm,
      isLoading: false,
    };
  }, [isLoading, totals, userNormItems, products, dishes, dishItems, dishPortions, blacklist, hasUserNorm]);
}
