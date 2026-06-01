import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalByLabelDetails } from '@/features/shared/components/ModalByLabelDetails';
import { SearchFood } from '@/features/food/food-search';
import { DetailsChips } from '@/features/food/details-chips';
import type {
  ReviewEditStep,
  ReviewRowUpdates,
  ReviewRowView,
} from '../model/useWriteFoodFlow';

export interface ReviewEditInputIds {
  SEARCH_INPUT: string;
  DETAILS_INPUT: string;
}

interface Props {
  row: ReviewRowView | null;
  step: ReviewEditStep;
  onChange: (updates: ReviewRowUpdates) => void;
  onClose: () => void;
  inputIds: ReviewEditInputIds;
}

/**
 * Edit modals for search (food replacement) and details (note). Time and
 * quantity are edited inline directly on the row (see FreeTextFoodReviewItem) —
 * no modal step for those.
 */
export const FreeTextFoodReviewEditModals = ({
  row,
  step,
  onChange,
  onClose,
  inputIds: { SEARCH_INPUT, DETAILS_INPUT },
}: Props) => {
  return (
    <div>
      {/* Search Food */}
      <ModalByLabel
        position="fixed"
        isExpanded={step === 'search'}
        content={
          <SearchFood
            onBack={onClose}
            title="Продукт"
            mode="products-only"
            onSelectFood={({ variant, id, name }) => {
              if (variant !== 'product') return;
              onChange({ productId: id, name });
              onClose();
            }}
            activeItemId={row?.productId ?? undefined}
            inputId={SEARCH_INPUT}
            initialSearchQuery={row?.originalName ?? row?.productName ?? ''}
          />
        }
      />

      {/* Details — position="fixed": оверлеится поверх fullscreen free-text
          review (длинный скроллящийся список); absolute уехал бы на верх
          документа при scrollTop>0. 4 schedule/dish консумера — absolute. */}
      <ModalByLabelDetails
        isExpanded={step === 'details'}
        position="fixed"
        variant="spring4"
        onCommit={onClose}
        title="Заметка о еде"
        onBack={onClose}
      >
        <DetailsChips
          textareaId={DETAILS_INPUT}
          value={row?.details ?? ''}
          onChange={(value) => onChange({ details: value })}
          productId={row?.productId ?? null}
        />
      </ModalByLabelDetails>
    </div>
  );
};

export default FreeTextFoodReviewEditModals;
