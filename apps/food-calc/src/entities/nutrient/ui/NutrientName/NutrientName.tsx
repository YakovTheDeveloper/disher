import clsx from 'clsx';
import { Text } from '@/shared/ui/atoms/Typography';
import s from './NutrientName.module.scss';

type Props = {
  /** Основное имя ряда (см. `nutrientRowName`). */
  name: string;
  /** Тихая подпись полного названия (у витаминов группы B). */
  subName?: string;
  /** `muted` — приглушённый ряд (нулевое значение): обе строки tertiary. */
  tone?: 'default' | 'muted';
  /** Снять левый инсет (в дровере имя не липнет к кромке карточки; в матрице
   *  первая колонка идёт вплотную к краю ячейки). */
  flush?: boolean;
  className?: string;
};

/**
 * Вертикальный стек имени нутриента: основное имя (body/semibold) + опциональная
 * тихая подпись полного названия (caption, tertiary, 0.72). Обе строки — nowrap
 * с ellipsis (min-width:0 по цепочке — корень требует minmax(0, …) у родителя).
 * Общий атом витрин нутриентов: плотные ряды NutrientTotals и первая колонка
 * матрицы «день × нутриенты».
 */
export function NutrientName({ name, subName, tone = 'default', flush, className }: Props) {
  return (
    <span className={clsx(s.root, tone === 'muted' && s.muted, flush && s.flush, className)}>
      <Text as="span" role="body" weight="semibold" className={s.name}>
        {name}
      </Text>
      {subName != null && (
        <Text as="span" role="caption" className={s.nameSub}>
          {subName}
        </Text>
      )}
    </span>
  );
}

export default NutrientName;
