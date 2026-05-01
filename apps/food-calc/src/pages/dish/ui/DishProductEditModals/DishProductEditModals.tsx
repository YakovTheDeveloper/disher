import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import type { DishProductFlow } from '../useDishProductFlow';

type Props = {
  flow: DishProductFlow;
};

const DishProductEditModals = ({ flow }: Props) => {
  const {
    step,
    draft,
    editingItem,
    handleFocusCapture,
    handleFoodSelect,
    handleCommit,
    handleClose,
    quantityContent,
    inputIds: { SEARCH_INPUT, QUANTITY_INPUT },
  } = flow;

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Search Food */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'search'}
        content={
          <ModalShell>
            <SearchFood
              mode="products-only"
              onSelectFood={handleFoodSelect}
              onInfoClick={() => {
                handleClose();
              }}
              onBack={handleClose}
              activeItemId={draft.productId ?? undefined}
              inputId={SEARCH_INPUT}
              initialSearchQuery={editingItem?.product?.name ?? undefined}
            />
          </ModalShell>
        }
      />

      {/* Quantity */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <ModalShell>
            <ModalShell.Body>
              {editingItem && (
                <>
                  <ProductQuantity
                    content={quantityContent}
                    onFinish={() => {}}
                    inputId={QUANTITY_INPUT}
                  />
                  <ModalShell.ActionButtons
                    left={<ModalPrevButton onClick={handleClose} />}
                    right={<ModalNextButton onClick={handleCommit} />}
                  />
                </>
              )}
            </ModalShell.Body>
          </ModalShell>
        }
      />
    </div>
  );
};

export default DishProductEditModals;
