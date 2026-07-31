import type { ReactNode } from 'react';
import { ActionList } from '@/shared/ui/ActionList';
import s from './FoodNormSections.module.scss';

type Props = {
  /**
   * Тело нутриентов — мера (NutrientGroupedList) + доборы (поле граммов, нота
   * «нет данных»). Живёт ВНУТРИ секции «Нутриенты» под контролом основы (запрос
   * 2026-07-19): список нутриентов принадлежит секции, а не висит соседом снизу.
   */
  nutrients?: ReactNode;
  /**
   * Вдвинуть контент секций на `--sys-inset-page` слева (лейбл остаётся
   * заподлицо). Opt-in дроверов еды (запрос 2026-07-19): содержимое садится под
   * своим заголовком, а не встык к краю. Прочие консумеры — заподлицо.
   */
  insetContent?: boolean;
};

/**
 * Общий заголовочный блок Nutrients-разбора продукта и блюда: секция меры
 * нутриентов (`ActionList.Section` — тот же примитив-секции, что держит корень
 * «Аккаунта»). Кнопка нормы переехала в хедер дроверов (NormFlagButton, 2026-07-22),
 * монеты-`DailyNormButton` здесь больше нет.
 */
export function FoodNormSections({ nutrients, insetContent = false }: Props) {
  const inset = (node: ReactNode) =>
    insetContent ? <div className={s.insetContent}>{node}</div> : node;

  return (
    <ActionList>
      {nutrients != null && <ActionList.Section>{inset(nutrients)}</ActionList.Section>}
    </ActionList>
  );
}

export default FoodNormSections;
