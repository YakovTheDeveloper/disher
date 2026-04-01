import { useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import clsx from 'clsx';
import styles from './SuggestionsReviewList.module.scss';

export type SuggestionItem = {
  productId: string;
  name: string;
  quantity: number;
};

export type SuggestionsReviewListRef = {
  getResultedItems: () => SuggestionItem[];
};

type Props = {
  items: SuggestionItem[];
};

function SuggestionsReviewListInner({ items }: Props, ref: React.Ref<SuggestionsReviewListRef>) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>();
    items.forEach((item) => map.set(item.productId, item.quantity));
    return map;
  });

  const toggleDelete = useCallback((productId: string) => {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, value: number) => {
    if (value < 0) return;
    setQuantities((prev) => {
      const next = new Map(prev);
      next.set(productId, value);
      return next;
    });
  }, []);

  const activeCount = useMemo(
    () => items.filter((i) => !deletedIds.has(i.productId)).length,
    [items, deletedIds]
  );

  useImperativeHandle(
    ref,
    () => ({
      getResultedItems: () =>
        items
          .filter((i) => !deletedIds.has(i.productId))
          .map((i) => ({
            ...i,
            quantity: quantities.get(i.productId) ?? i.quantity,
          })),
    }),
    [items, deletedIds, quantities]
  );

  return (
    <div className={styles.container}>
      {items.map((item) => {
        const isDeleted = deletedIds.has(item.productId);
        const canDelete = !isDeleted && activeCount > 1;

        return (
          <div key={item.productId} className={clsx(styles.row, isDeleted && styles.deleted)}>
            <span className={styles.name}>{item.name}</span>
            <div className={styles.quantityGroup}>
              <input
                type="number"
                inputMode="numeric"
                className={styles.quantityInput}
                value={quantities.get(item.productId) ?? item.quantity}
                onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                disabled={isDeleted}
                min={0}
              />
              <span className={styles.unit}>г</span>
            </div>
            {(canDelete || isDeleted) && (
              <button className={styles.actionBtn} onClick={() => toggleDelete(item.productId)}>
                {isDeleted ? '↩' : '×'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const SuggestionsReviewList = forwardRef(SuggestionsReviewListInner);
