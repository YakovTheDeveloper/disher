import { useRef, useEffect } from 'react';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SuggestionsReviewList, useDishSuggestions } from '@/features/dish/suggest-products';
import type { SuggestionsReviewListRef } from '@/features/dish/suggest-products';
import { addDishItem } from '@/entities/dish';
import { Button } from '@/shared/ui/atoms/Button';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import styles from './DishSuggestionsModal.module.scss';

export const DISH_SUGGESTIONS_INPUT_IDS = {
  TRIGGER: 'dish-suggestions-trigger',
} as const;

type Props = {
  isExpanded: boolean;
  dishId: string;
  dishName: string;
  existingItems: Array<{ productId: string; name: string; quantity: number }>;
  onClose: () => void;
};

const DishSuggestionsModal = ({ isExpanded, dishId, dishName, existingItems, onClose }: Props) => {
  const { state, fetchSuggestions, reset } = useDishSuggestions();
  const listRef = useRef<SuggestionsReviewListRef>(null);

  useSwipeableLock(isExpanded);

  useEffect(() => {
    if (isExpanded && state.status === 'idle') {
      fetchSuggestions(dishName, existingItems);
    }
  }, [isExpanded]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = async () => {
    const items = listRef.current?.getResultedItems();
    if (!items || items.length === 0) {
      toaster.error('Нет продуктов для добавления');
      return;
    }

    const result = await safeMutate(
      () =>
        Promise.all(
          items.map((item) =>
            addDishItem({ dishId, productId: item.productId, quantity: item.quantity })
          )
        ),
      'Не удалось добавить продукты'
    );
    if (result === undefined) return;

    toaster.success(`Добавлено: ${items.length}`);
    handleClose();
  };

  return (
    <ModalByLabel
      position="absolute"
      isExpanded={isExpanded}
      content={
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={handleClose}>
              ←
            </button>
            <span className={styles.title}>Предложения для «{dishName}»</span>
          </div>

          <div className={styles.content}>
            {state.status === 'loading' && (
              <div className={styles.center}>
                <Spinner size={24} />
                <p className={styles.hint}>Подбираем продукты...</p>
              </div>
            )}

            {state.status === 'error' && (
              <div className={styles.center}>
                <p className={styles.error}>{state.error}</p>
                <Button
                  variant="secondary"
                  onClick={() => fetchSuggestions(dishName, existingItems)}
                >
                  Попробовать снова
                </Button>
              </div>
            )}

            {state.status === 'done' && state.suggestions.length === 0 && (
              <div className={styles.center}>
                <p className={styles.hint}>Не удалось найти подходящие продукты</p>
              </div>
            )}

            {state.status === 'done' && state.suggestions.length > 0 && (
              <>
                <SuggestionsReviewList ref={listRef} items={state.suggestions} />
                <div className={styles.actions}>
                  <Button variant="primary-form" onClick={handleConfirm}>
                    Добавить выбранные
                  </Button>
                </div>
              </>
            )}
          </div>
          {/* Hidden input for ModalByLabel focus trigger */}
          <input id={DISH_SUGGESTIONS_INPUT_IDS.TRIGGER} className={styles.hiddenInput} readOnly />
        </div>
      }
    />
  );
};

export default DishSuggestionsModal;
