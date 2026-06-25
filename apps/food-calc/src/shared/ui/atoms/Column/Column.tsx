import type { ElementType, ComponentPropsWithoutRef, CSSProperties } from 'react';
import clsx from 'clsx';
import styles from './Column.module.scss';

type ColumnOwnProps<T extends ElementType> = {
  as?: T;
  /** Зазор между детьми. По умолчанию 0 — когда детьми идут `<TapTarget>`,
   *  их padding сам даёт ритм, а нулевой gap держит колонку сплошной тап-зоной
   *  без мёртвых полос. */
  gap?: number | string;
};

export type ColumnProps<T extends ElementType = 'div'> = ColumnOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ColumnOwnProps<T>>;

/**
 * Column — layout-примитив: вертикальная стопка (flex-column).
 *
 * Нужен там, где в одной зоне ряда стоят НЕСКОЛЬКО отдельных таргетов колонкой
 * (напр. имя + детали в предложке — две разные зоны редактирования). Чистая
 * раскладка, без поведения и без отступов сверх `gap`. Если стопку уже даёт
 * grid родительской карточки — Column не нужен.
 */
export function Column<T extends ElementType = 'div'>({
  as,
  gap,
  className,
  style,
  ...rest
}: ColumnProps<T>) {
  const Comp = (as ?? 'div') as ElementType;
  const mergedStyle =
    gap != null ? ({ ...style, gap } as CSSProperties) : (style as CSSProperties);
  return <Comp className={clsx(styles.col, className)} style={mergedStyle} {...rest} />;
}

export default Column;
