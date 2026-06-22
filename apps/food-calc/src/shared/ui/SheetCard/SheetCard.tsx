import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import styles from './SheetCard.module.scss';

export interface SheetCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Заголовок секции — просто строка; типографику владеет SheetCard. */
  header?: ReactNode;
  /** Нижний ряд действий (кнопки). Рендерится в инкапсулированном actions-слоте. */
  actions?: ReactNode;
  children?: ReactNode;
}

/**
 * SheetCard — «карточка на листке»: плоская скруглённая плашка на бумаге
 * (off-white pearl-глянец, БЕЗ elevation). Общий контейнер предложки и секций
 * «Наблюдения» / «Гипотезы». Любые data-/event-пропсы (data-state,
 * data-write-food-anchor, onFocusCapture, …) и ref прокидываются на корневой узел.
 */
export const SheetCard = forwardRef<HTMLDivElement, SheetCardProps>(function SheetCard(
  { header, actions, children, className, ...rest },
  forwardedRef,
) {
  return (
    <div ref={forwardedRef} className={clsx(styles.sheet, className)} {...rest}>
      {header != null && (
        <div className={styles.header}>
          <Heading size="section" className={styles.title}>
            {header}
          </Heading>
        </div>
      )}
      {children}
      {actions != null && <div className={styles.actions}>{actions}</div>}
    </div>
  );
});

export default SheetCard;
