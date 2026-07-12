import clsx from 'clsx';
import { Numeral, Text } from '@/shared/ui/atoms/Typography';
import s from './NutrientTotalsColumn.module.scss';

export type NutrientTotalCell = { key: string; label: string; value: string };

type Props = {
  cells: NutrientTotalCell[];
  /**
   * Горизонтальная привязка выровненной таблицы:
   *   'end' (деф.) — прижата вправо (NutrientsBar, к шеврону);
   *   'start'      — к левому краю (превью «Моя норма», в ритме формы).
   */
  align?: 'start' | 'end';
  className?: string;
};

// Выровненная «как gofmt» 2-колоночная сводка нутриентов: подписи слева, числа
// справа, единицы строго друг под другом (tnum + justify-self:end). Единый
// источник облика для сводки за день (NutrientsBar, экран «Рацион») и превью
// «Моя норма» — чтобы два места не разъезжались. Хост владеет бровкой/рамкой/
// кликом; примитив несёт ТОЛЬКО выровненную таблицу.
export const NutrientTotalsColumn = ({ cells, align = 'end', className }: Props) => (
  <div className={clsx(s.cells, align === 'start' && s.alignStart, className)}>
    {cells.map((c) => (
      <span key={c.key} className={s.cell}>
        <Text as="span" role="caption" className={s.label}>
          {c.label}
        </Text>
        <Numeral as="span" size="md" weight="black" className={s.value}>
          {c.value}
        </Numeral>
      </span>
    ))}
  </div>
);

export default NutrientTotalsColumn;
