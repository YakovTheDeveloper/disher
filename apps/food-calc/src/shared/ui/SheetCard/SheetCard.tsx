import { forwardRef, useCallback, type HTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import styles from './SheetCard.module.scss';

// Характер глянца на общем anchor `Predlozhka`. `pearl` первым = дефолт
// (база в SheetCard.module.scss). Все плашки (предложка + Наблюдения +
// Гипотезы) делят ключ → один тумблер DesignBar правит тон сразу всем.
const SHEET_VARIANTS = ['pearl', 'satin', 'glass', 'frost'] as const;

export interface SheetCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Заголовок секции — просто строка; типографику владеет SheetCard. */
  header?: ReactNode;
  /** Нижний ряд действий (кнопки). Рендерится в инкапсулированном actions-слоте. */
  actions?: ReactNode;
  children?: ReactNode;
}

/**
 * SheetCard — «карточка на листке»: плоская скруглённая плашка на бумаге
 * (off-white + едва уловимый глянец, БЕЗ elevation). Общий контейнер предложки
 * и секций «Наблюдения» / «Гипотезы». Характер глянца — DesignBar (`Predlozhka`,
 * дефолт pearl). Любые data-/event-пропсы (data-state, data-write-food-anchor,
 * onFocusCapture, …) и ref прокидываются на корневой узел.
 */
export const SheetCard = forwardRef<HTMLDivElement, SheetCardProps>(function SheetCard(
  { header, actions, children, className, ...rest },
  forwardedRef,
) {
  const { anchor } = useDesignVariant('Predlozhka', SHEET_VARIANTS);
  const anchorRef = anchor.ref;

  // Сливаем IntersectionObserver-ref варианта с прокинутым наружу ref.
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      anchorRef(el);
      if (typeof forwardedRef === 'function') forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    },
    [anchorRef, forwardedRef],
  );

  return (
    <div
      ref={setRef}
      className={clsx(styles.sheet, className)}
      data-dv={anchor['data-dv']}
      data-dv-v={anchor['data-dv-v']}
      {...rest}
    >
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
