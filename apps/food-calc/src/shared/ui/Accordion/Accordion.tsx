import { useId, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Accordion.module.scss';

// Шеврон по умолчанию — currentColor (тинтуется цветом шапки), вращается на open.
// Inline-svg: в icons/ нет «caret-вниз» нужного размера.
const Caret = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" className={className}>
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export type AccordionProps = {
  /** Контент шапки слева — передавать типо-примитив (<Heading>/<Text>/<QuietLabel>). */
  title: ReactNode;
  /** Опциональный контент справа от тайтла, перед шевроном (счётчик/подсказка). */
  trailing?: ReactNode;
  children: ReactNode;
  /** Controlled open. Опустить для uncontrolled (см. defaultOpen). */
  open?: boolean;
  defaultOpen?: boolean;
  /** Вызывается со следующим значением open при тапе по шапке. */
  onToggle?: (next: boolean) => void;
  /** Скрыть дефолт-шеврон (когда индикатор несёт сам тайтл, напр. +/−). */
  hideChevron?: boolean;
  /**
   * Монтировать тело только пока открыто (без reveal-анимации). Для тяжёлых тел,
   * где always-mount + grid-reveal дорог. Канон-форма — grid-reveal (lazyMount=false).
   */
  lazyMount?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
};

/**
 * Accordion — раскрывающаяся секция «шапка-тоггл + тело». Канон-механика:
 * composite-reveal через grid-template-rows 0fr→1fr (анимируем grid-track, не
 * height — без layout-thrash); reduced-motion глушит. A11y: `aria-expanded` на
 * шапке + `aria-controls`/`id` связь шапки с телом. Типографику тайтла и любой
 * фон/тинт несёт консумер (слоты + className-хуки) — примитив владеет только
 * раскрытием, шевроном и доступностью.
 */
export function Accordion({
  title,
  trailing,
  children,
  open,
  defaultOpen = false,
  onToggle,
  hideChevron = false,
  lazyMount = false,
  className,
  headerClassName,
  bodyClassName,
}: AccordionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const bodyId = useId();
  const headerId = useId();

  const handleToggle = () => {
    const next = !isOpen;
    if (!isControlled) setInternalOpen(next);
    onToggle?.(next);
  };

  const hasEnd = trailing != null || !hideChevron;

  return (
    <div className={clsx(styles.root, className)}>
      <button
        type="button"
        id={headerId}
        className={clsx(styles.header, headerClassName)}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={bodyId}
      >
        <span className={styles.titleSlot}>{title}</span>
        {hasEnd && (
          <span className={styles.end}>
            {trailing}
            {!hideChevron && <Caret className={clsx(styles.chevron, isOpen && styles.chevronOpen)} />}
          </span>
        )}
      </button>

      {lazyMount ? (
        isOpen && (
          <div id={bodyId} className={bodyClassName}>
            {children}
          </div>
        )
      ) : (
        <div id={bodyId} className={clsx(styles.reveal, isOpen && styles.revealOpen)}>
          <div className={clsx(styles.revealInner, bodyClassName)}>{children}</div>
        </div>
      )}
    </div>
  );
}

export default Accordion;
