import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import { DetailsChips } from '@/features/food/details-chips';
import type { DishProductFlow } from '../useDishProductFlow';

type Props = {
  flow: DishProductFlow;
};

const DishProductEditModals = ({ flow }: Props) => {
  const {
    step,
    draft,
    setDraft,
    editingItem,
    handleFocusCapture,
    handleFoodSelect,
    handleCommit,
    handleClose,
    quantityContent,
    inputIds: { SEARCH_INPUT, QUANTITY_INPUT, DETAILS_INPUT },
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

      {/* Details — entry point in edit is tap-on-name on a dish-item row */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'details'}
        content={
          <ModalShell>
            <ModalShell.Body>
              <ModalShell.Title>
                {editingItem?.product?.name
                  ? `Уточнение: ${editingItem.product.name}`
                  : 'Уточнение к ингредиенту'}
              </ModalShell.Title>
              <DetailsChips
                textareaId={DETAILS_INPUT}
                value={draft.details}
                onChange={(value) => setDraft((d) => ({ ...d, details: value }))}
                productId={draft.productId}
              />
              <ModalShell.ActionButtons
                left={<ModalPrevButton onClick={handleClose} />}
                right={<ModalNextButton onClick={handleCommit} />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />
    </div>
  );
};

export default DishProductEditModals;
