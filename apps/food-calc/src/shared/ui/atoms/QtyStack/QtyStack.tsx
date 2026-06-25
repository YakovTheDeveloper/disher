import type { ElementType, ComponentPropsWithoutRef, ReactNode } from 'react';
import clsx from 'clsx';
import { TapTarget } from '@/shared/ui/atoms/TapTarget';
import styles from './QtyStack.module.scss';

type QtyStackOwnProps<T extends ElementType> = {
  /** Единица измерения — спускается ПОД значение, по его левому краю. */
  unit: ReactNode;
  /** Значение: текст (покой) ИЛИ <input> (правка). Свопит owner-карточка —
   *  состояние правки (draft/commit) у каждой карточки своё. */
  children: ReactNode;
  /** Тег тап-зоны. По умолчанию `span` (еда: inline-своп input). Для правки через
   *  модалку нужен `label` + htmlFor (iOS focus-канон — dish/предложка qty).
   *  `as?: T` (как TapTarget) — чтобы TS вывел тег из `as` и принял его пропсы
   *  (`htmlFor` на label и т.п.); иначе T залипал бы на 'span'. */
  as?: T;
};

export type QtyStackProps<T extends ElementType = 'span'> = QtyStackOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof QtyStackOwnProps<T>>;

/**
 * QtyStack — количество вертикальной стопкой: значение сверху, единица прямо
 * под началом значения. Сам по себе тап-таргет (правка количества); владеет
 * прес-хромом (тёплый press-flash) и стабильной шириной (число↔input не дёргает
 * ряд). Раскладку строки держит CardLayout — это лишь содержимое title-кластера.
 *
 * Полиморфен (как TapTarget): `as="span"` (default, inline-правка) ИЛИ
 * `as="label"` + htmlFor (правка через модалку, iOS focus-канон).
 *
 * См. tds/ANALYSIS/cardshell-unification-2026-06-25.md
 */
export function QtyStack<T extends ElementType = 'span'>({
  as,
  unit,
  children,
  className,
  ...rest
}: QtyStackProps<T>) {
  return (
    <TapTarget as={(as ?? 'span') as ElementType} className={clsx(styles.qty, className)} {...rest}>
      <span className={styles.value}>{children}</span>
      <span className={styles.unit}>{unit}</span>
    </TapTarget>
  );
}

export default QtyStack;
