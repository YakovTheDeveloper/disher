import { memo } from 'react';
import { ListItemProps, ListItemBase } from './List.types';
import styles from './List.module.scss';

/**
 * Individual virtualized list item
 * Memoized to prevent unnecessary re-renders
 */
function ListItemComponent<T extends ListItemBase>({
  virtualRow,
  item,
  renderListContent,
  onClick,
}: ListItemProps<T>) {
  return (
    <label
      htmlFor="quantity-input"
      data-index={virtualRow.index}
      className={styles.virtualItem}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        transform: `translateY(${virtualRow.start}px)`,
        height: virtualRow.size,
      }}
      onClick={onClick}
      role="option"
      aria-selected="false"
    >
      {renderListContent(item)}
    </label>
  );
}

// Type assertion for generic memo component
const TypedListItem = memo(ListItemComponent) as <T extends ListItemBase>(
  props: ListItemProps<T>
) => JSX.Element;

(TypedListItem as { displayName?: string }).displayName = 'ListItem';

export { TypedListItem as ListItem };
