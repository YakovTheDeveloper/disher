import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalByLabelDetails } from '@/features/shared/components/ModalByLabelDetails';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell, ModalVariantFields } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
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

  // edit-флоу (тап по названию ингредиента): в шапке — само название продукта.
  const detailsTitle = editingItem?.product?.name ?? 'Уточнение к ингредиенту';

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Search Food — голый SearchFood с единым баром [← Продукт 🔍],
          flush к краю как на HomePage / создании продукта в блюде. */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'search'}
        content={
          <ModalVariantFields>
            <SearchFood
              mode="products-only"
              title="Продукт"
              onSelectFood={handleFoodSelect}
              onInfoClick={() => {
                handleClose();
              }}
              onBack={handleClose}
              activeItemId={draft.productId ?? undefined}
              inputId={SEARCH_INPUT}
              initialSearchQuery={editingItem?.product?.name ?? undefined}
            />
          </ModalVariantFields>
        }
      />

      {/* Quantity */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <ModalShell>
            <ModalShell.Header title="Количество" onBack={handleClose} />
            <ModalShell.Body>
              {editingItem && (
                <>
                  <ProductQuantity
                    content={quantityContent}
                    onFinish={() => {}}
                    inputId={QUANTITY_INPUT}
                  />
                  <ModalShell.ActionButtons
                    right={<ModalNextButton onClick={handleCommit} variant="finish" />}
                  />
                </>
              )}
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Details — entry point in edit is tap-on-name on a dish-item row */}
      <ModalByLabelDetails
        isExpanded={step === 'details'}
        onCommit={handleCommit}
        title={detailsTitle}
        onBack={handleClose}
      >
        <DetailsChips
          textareaId={DETAILS_INPUT}
          value={draft.details}
          onChange={(value) => setDraft((d) => ({ ...d, details: value }))}
          productId={draft.productId}
        />
      </ModalByLabelDetails>
    </div>
  );
};

export default DishProductEditModals;
