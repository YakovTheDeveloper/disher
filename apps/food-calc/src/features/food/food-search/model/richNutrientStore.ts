import { create } from 'zustand';

export type RichNutrient = { id: string; unit: string };

interface RichNutrientState {
  richNutrient: RichNutrient | null;
  setRichNutrient: (next: RichNutrient | null) => void;
  clearRichNutrient: () => void;
}

/**
 * Выбранный нутриент для фильтра «Еда богатая нутриентом» в SearchFood.
 *
 * Зачем стор, а не useState: консумеры рендерят `<SearchFood key={sessionKey}>` и
 * бампают key после каждого добавления еды → SearchFood ремонтится. Локальный стейт
 * при этом обнулялся бы, и фильтр слетал после первого же добавления. Стор живёт
 * над remount'ом, поэтому выбор держится, пока юзер сам не снимет его крестиком.
 *
 * НЕ персистим (in-memory): перезагрузка / sign-out сбрасывают. Сознательно общий
 * на все инстансы SearchFood (один выбор на сессию).
 */
export const useRichNutrientStore = create<RichNutrientState>((set) => ({
  richNutrient: null,
  setRichNutrient: (next) => set({ richNutrient: next }),
  clearRichNutrient: () => set({ richNutrient: null }),
}));
