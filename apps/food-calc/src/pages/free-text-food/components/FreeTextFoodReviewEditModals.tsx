import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { DetailsChips } from '@/features/food/details-chips';
import { useProductPortions } from '@/entities/product';

export type ReviewEditStep = 'idle' | 'time' | 'search' | 'quantity' | 'details';

export interface ReviewEditInputIds {
  TIME_INPUT: string;
  SEARCH_INPUT: string;
  QUANTITY_INPUT: string;
  DETAILS_INPUT: string;
}

export interface ReviewRowView {
  uid: string;
  time: string;
  quantity: number;
  productId: string | null;
  productName: string;
  details: string;
  originalName: string;
}

export interface ReviewRowUpdates {
  time?: string;
  quantity?: number;
  productId?: string;
  name?: string;
  details?: string;
}

interface Props {
  row: ReviewRowView | null;
  step: ReviewEditStep;
  hideTime?: boolean;
  onChange: (updates: ReviewRowUpdates) => void;
  onClose: () => void;
  inputIds: ReviewEditInputIds;
}

export const FreeTextFoodReviewEditModals = ({
  row,
  step,
  hideTime,
  onChange,
  onClose,
  inputIds: { TIME_INPUT, SEARCH_INPUT, QUANTITY_INPUT, DETAILS_INPUT },
}: Props) => {
  const portions = useProductPortions(row?.productId ?? undefined);

  const quantityContent = {
    quantity: row?.quantity ?? 0,
    updateQuantity: (q: number) => onChange({ quantity: q }),
    product: { portions: portions ?? [] },
  };

  return (
    <div>
      {/* Time */}
      <ModalByLabel
        position="fixed"
        isExpanded={!hideTime && step === 'time'}
        content={
          <ModalShell>
            <ModalShell.Header title="Время" onBack={onClose} />
            <ModalShell.Body>
              <TimeChoose
                onFinish={(time) => {
                  onChange({ time });
                  onClose();
                }}
                initialTime={row?.time ?? '00:00'}
                inputId={TIME_INPUT}
              />
              <ModalShell.ActionButtons
                right={<ModalNextButton onClick={onClose} variant="finish" />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />

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

      {/* Quantity */}
      <ModalByLabel
        position="fixed"
        isExpanded={step === 'quantity'}
        content={
          <ModalShell>
            <ModalShell.Header title="Количество" onBack={onClose} />
            <ModalShell.Body>
              <ProductQuantity
                content={quantityContent}
                onFinish={() => {}}
                inputId={QUANTITY_INPUT}
              />
              <ModalShell.ActionButtons
                right={<ModalNextButton onClick={onClose} variant="finish" />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Details */}
      <ModalByLabel
        position="fixed"
        isExpanded={step === 'details'}
        content={
          <ModalShell>
            <ModalShell.Header title="Заметка о еде" onBack={onClose} />
            <ModalShell.Body>
              <DetailsChips
                textareaId={DETAILS_INPUT}
                value={row?.details ?? ''}
                onChange={(value) => onChange({ details: value })}
                productId={row?.productId ?? null}
              />
              <ModalShell.ActionButtons
                right={<ModalNextButton onClick={onClose} variant="finish" />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />
    </div>
  );
};

export default FreeTextFoodReviewEditModals;
