import { useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import clsx from 'clsx';
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

  const toggleDelete = useCallback((id: string) => {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const activeCount = useMemo(
    () => items.filter((i) => !deletedIds.has(i.id)).length,
    [items, deletedIds]
  );

  useImperativeHandle(
    ref,
    () => ({
      getResultedItemsIds: () => {
        const ids = items.filter((i) => !deletedIds.has(i.id)).map(({ id }) => id);
        return {
          asSet: new Set(ids),
          asArray: ids,
        };
      },
    }),
    [items, deletedIds]
  );

  return (
    <div className={styles.container}>
      {items.map((item) => {
        const isDeleted = deletedIds.has(item.id);
        const canDelete = !isDeleted && activeCount > 1;

        return (
          <div key={item.id} className={clsx(styles.row, isDeleted && styles.deleted)}>
            <span className={styles.itemContent}>{renderItem(item)}</span>
            {(canDelete || isDeleted) && (
              <button className={styles.actionBtn} onClick={() => toggleDelete(item.id)}>
                {isDeleted ? '↩' : '×'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const EditableList = forwardRef(EditableListInner) as <T extends { id: string }>(
  props: Props<T> & { ref?: React.Ref<EditableListRef> }
) => React.ReactElement;
