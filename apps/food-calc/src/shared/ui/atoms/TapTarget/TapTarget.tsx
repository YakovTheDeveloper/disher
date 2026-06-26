import type { ElementType, ComponentPropsWithoutRef } from 'react';
import clsx from 'clsx';
import styles from './TapTarget.module.scss';

type TapTargetOwnProps<T extends ElementType> = {
  /** Какой тег рендерить. По умолчанию `div`; для делегации фокуса — `label`
   *  (+ `htmlFor`), для самостоятельной кнопки — `button`. */
  as?: T;
};

export type TapTargetProps<T extends ElementType = 'div'> = TapTargetOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof TapTargetOwnProps<T>>;

/**
 * TapTarget — ячейка-зона нажатия в ряду-карточке.
 *
 * Единственная задача — гарантировать комфортную кликабельную площадь
 * (Apple HIG 44 / Material 3 48 / WCAG 2.2): запекает вертикальный
 * `padding-block` (--sys-tap-pad-block), который растёт ВМЕСТЕ с контентом, а не
 * фиксированной высотой. Соседние TapTarget в колонке идут впритык (gap 0) —
 * паддинг сам даёт ритм, и вся колонка кликабельна без мёртвых полос.
 *
 * НЕ диктует раскладку (`display` не задан — layout через className потребителя,
 * см. `shared-mixin-no-display`). Полиморфен: владеет нажатием через свой тег
 * (`as="label"` + htmlFor — iOS focus-канон; `as="button"` — самостоятельная
 * кнопка). Принимает любое число детей — для зоны из 2+ элементов оборачивает
 * `<Column>`.
 *
 * Консумеры: ScheduleEventCard, ScheduleFoodItem, ProposalFoodItem,
 * DishBuilderPage.
 */
export function TapTarget<T extends ElementType = 'div'>({
  as,
  className,
  ...rest
}: TapTargetProps<T>) {
  const Comp = (as ?? 'div') as ElementType;
  return <Comp className={clsx(styles.tap, className)} {...rest} />;
}

export default TapTarget;
