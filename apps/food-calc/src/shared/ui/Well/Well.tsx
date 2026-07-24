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
   * depth) — почти-белый слот не спорит с приподнятыми surface-2 плитками.
   *
   * `deep` — тот же тёплый агент, но канавка МЕЛЬЧЕ: 2% вместо дефолтных 4%. На белом
   * дровере (surface-2) 4% вырождались в серое пятно; 2% — едва тронутая тёплая
   * заливка, почти-белый слот, углы держит контейнерный радиус базы. Для титульных
   * вдавленных панелей на белом дровере (секция «Дневная норма»). Дефолт
   * `default` — исходное поведение без изменений.
   */
  variant?: 'default' | 'round' | 'deep';
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
      className={clsx(
        s.well,
        SURFACE_CLASS[onSurface],
        variant === 'round' && s.round,
        variant === 'deep' && s.deep,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export default Well;
