import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';
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
  note?: string;
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
                left={<ModalPrevButton onClick={onClose} />}
                right={<ModalNextButton onClick={onClose} />}
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
            <ModalShell.Body>
              <ProductQuantity
                content={quantityContent}
                onFinish={() => {}}
                inputId={QUANTITY_INPUT}
              />
              <ModalShell.ActionButtons
                left={<ModalPrevButton onClick={onClose} />}
                right={<ModalNextButton onClick={onClose} />}
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
            <ModalShell.Body>
              <ModalShell.Title>Заметка о еде</ModalShell.Title>
              <Textarea
                id={DETAILS_INPUT}
                value={row?.details ?? ''}
                onChange={(value) => onChange({ note: value })}
                placeholder="Заметка к записи..."
                rows={3}
                maxLength={500}
              />
              <ModalShell.ActionButtons
                left={<ModalPrevButton onClick={onClose} />}
                right={<ModalNextButton onClick={onClose} />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />
    </div>
  );
};

export default FreeTextFoodReviewEditModals;
