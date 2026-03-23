import { useRef, useEffect, useCallback, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './VirtualList.module.scss';
import clsx from 'clsx';

const ESTIMATED_ITEM_HEIGHT = 44;
const OVERSCAN = 5;

type Props<T extends { id: string | number }> = {
  items: readonly T[];
  renderItem: (item: T) => ReactNode;
  emptyContent?: ReactNode;
  itemHtmlFor?: string;
  className?: string;
};

function VirtualList<T extends { id: string | number }>({
  items,
  renderItem,
  emptyContent,
  itemHtmlFor,
  className,
}: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ESTIMATED_ITEM_HEIGHT,
    overscan: OVERSCAN,
  });

  const isProgrammaticScrollRef = useRef(false);

  // Scroll to top when items change (search/filter)
  useEffect(() => {
    isProgrammaticScrollRef.current = true;
    const timeout = setTimeout(() => {
      virtualizer.scrollToIndex(0, { align: 'start' });
      requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false;
      });
    }, 0);
    return () => clearTimeout(timeout);
  }, [items.length, virtualizer]);

  // Blur keyboard on scroll (mobile UX) — skip programmatic scrolls
  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
      active.blur();
    }
  }, []);

  const virtualItems = virtualizer.getVirtualItems();
  const totalHeight = virtualizer.getTotalSize();

  return (
    <div
      ref={containerRef}
      className={clsx(styles.container, className)}
      onScroll={handleScroll}
      role="listbox"
    >
      <ul
        className={styles.list}
        style={{ height: totalHeight ? `${totalHeight}px` : 'auto', position: 'relative' }}
      >
        {virtualItems.map((vRow) => {
          const item = items[vRow.index];
          if (!item) return null;
          return (
            <label
              key={vRow.key}
              htmlFor={itemHtmlFor}
              data-index={vRow.index}
              className={styles.virtualItem}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vRow.start}px)`,
                height: vRow.size,
              }}
              role="option"
            >
              {renderItem(item)}
            </label>
          );
        })}

        {items.length === 0 && emptyContent && (
          <div className={styles.noResults}>{emptyContent}</div>
        )}
      </ul>
    </div>
  );
}

export default VirtualList;
