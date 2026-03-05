import { useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';

export type EditableListRef<T> = {
  getItems: () => T[];
};

type Props<T extends { id: string }> = {
  items: readonly T[];
  renderItem: (item: T) => React.ReactNode;
};

function EditableListInner<T extends { id: string }>(
  { items, renderItem }: Props<T>,
  ref: React.Ref<EditableListRef<T>>
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
      getItems: () => visibleItems,
    }),
    [visibleItems]
  );

  return (
    <div>
      {visibleItems.map((item) => (
        <div key={item.id}>
          {renderItem(item)}
          <button onClick={() => handleDelete(item.id)}>×</button>
        </div>
      ))}

      {deletedItems.length > 0 && (
        <div>
          <div>Удалённые</div>

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
  props: Props<T> & { ref?: React.Ref<EditableListRef<T>> }
) => React.ReactElement;
