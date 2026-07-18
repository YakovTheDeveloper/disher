import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import s from './Well.module.scss';

export interface WellProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Тир поверхности, НА которой лежит лоток (0 стол / 1 парящий лист / 2 белый
   * модал-дровер). Из него выводится утопленный тон + inset-тень (SURFACE-AWARE
   * field-depth): дно «канавки» на постоянный шаг ниже хоста. Дефолт 2 (дровер/модал).
   */
  onSurface?: 0 | 1 | 2;
  /**
   * `round` — лоток ПОД ряд КРУГЛЫХ кнопок (нав-монеты, ряд правок ItemActionsDrawer):
   * капсульная обводка перекликается с кругами внутри (контейнерный радиус читался бы
   * «квадратом»), а канавка холоднее и бледнее (grey-shade вместо warm-brown, мельче
   * depth) — почти-белый слот не спорит с приподнятыми surface-2 плитками. Дефолт
   * `default` — исходное поведение без изменений.
   */
  variant?: 'default' | 'round';
  children?: ReactNode;
}

const SURFACE_CLASS = { 0: s.onSurface0, 1: s.onSurface1, 2: s.onSurface2 } as const;

/**
 * Well — утопленный («вдавленный») контейнер: тон на шаг ниже хоста + одна inset-тень
 * на весь блок, со своими внутренними отступами. Прямая инверсия `SheetCard` (тот
 * ПРИПОДНЯТ над бумагой). Дом «вдавленности» дизайн-системы — сюда кладут группы
 * контролов, которые должны читаться врезанными в лист (лоток быстрых действий,
 * панель фильтров). Глубину несёт канонический field-depth, а не ручной хекс.
 * data-/aria-пропсы и ref прокидываются на корневой узел.
 */
export const Well = forwardRef<HTMLDivElement, WellProps>(function Well(
  { onSurface = 2, variant = 'default', children, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx(s.well, SURFACE_CLASS[onSurface], variant === 'round' && s.round, className)}
      {...rest}
    >
      {children}
    </div>
  );
});

export default Well;
