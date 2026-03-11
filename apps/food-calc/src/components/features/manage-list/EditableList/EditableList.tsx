import { useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import styles from './EditableList.module.scss';
export type EditableListRef = {
  getResultedItemsIds: () => {
    asSet: Set<string>;
    asArray: string[];
  };
};

type Props<T extends { id: string }> = {
  items: readonly T[];
  renderItem: (item: T) => React.ReactNode;
};

function EditableListInner<T extends { id: string }>(
  { items, renderItem }: Props<T>,
  ref: React.Ref<EditableListRef>
) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const handleDelete = useCallback((id: string) => {
    setDeletedIds((prev) => new Set(prev).add(id));
  }, []);

  const handleRestore = useCallback((id: string) => {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const visibleItems = useMemo(
    () => items.filter((i) => !deletedIds.has(i.id)),
    [items, deletedIds]
  );

  const deletedItems = useMemo(
    () => items.filter((i) => deletedIds.has(i.id)),
    [items, deletedIds]
  );

  useImperativeHandle(
    ref,
    () => ({
      getResultedItemsIds: () => {
        const ids = visibleItems.map(({ id }) => id);
        return {
          asSet: new Set(ids),
          asArray: ids,
        };
      },
    }),
    [visibleItems]
  );

  const canDelete = visibleItems.length > 1;

  return (
    <div className={styles.container}>
      {visibleItems.map((item) => (
        <div key={item.id}>
          {renderItem(item)}
          {canDelete && <button onClick={() => handleDelete(item.id)}>×</button>}
        </div>
      ))}

      {deletedItems.length > 0 && (
        <div className={styles.deletedSection}>
          <div className={styles.deletedLabel}>Удалённые</div>

          {deletedItems.map((item) => (
            <div key={item.id}>
              {renderItem(item)}
              <button onClick={() => handleRestore(item.id)}>↩</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const EditableList = forwardRef(EditableListInner) as <T extends { id: string }>(
  props: Props<T> & { ref?: React.Ref<EditableListRef> }
) => React.ReactElement;
