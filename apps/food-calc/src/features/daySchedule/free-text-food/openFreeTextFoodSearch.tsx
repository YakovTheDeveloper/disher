import { SearchFood } from '@/features/food/food-search';
import { modalStore, type BaseModalProps } from '@/shared/ui';
import type { MatchCandidate } from './api';
import styles from './FreeTextFoodModal.module.scss';

type Props = BaseModalProps<MatchCandidate | null> & {
  initialQuery: string;
};

const FreeTextFoodSearchModal = ({ initialQuery, onClose }: Props) => {
  return (
    <div className={styles.searchOverlay}>
      <SearchFood
        mode="products-only"
        initialSearchQuery={initialQuery}
        onSelectFood={({ variant, id, name }) => {
          if (variant !== 'product') {
            onClose(null);
            return;
          }
          onClose({ id, name, score: 1 });
        }}
        onBack={() => onClose(null)}
      />
    </div>
  );
};

export async function openFreeTextFoodSearch(
  initialQuery: string,
): Promise<MatchCandidate | null> {
  const picked = await modalStore.show(FreeTextFoodSearchModal, { initialQuery });
  return picked ?? null;
}
