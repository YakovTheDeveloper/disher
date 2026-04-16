import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { popOverlayEntry } from '@/shared/lib/overlay-history';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';
import { DetailsNoteButton } from '@/features/shared/components/DetailsNoteButton';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';

import { useScheduleFoodFlow, type Step } from './useScheduleFoodFlow';

type Props = {
  item: ScheduleFoodWithRelations;
  initialStep?: Step;
  onClose: () => void;
};

const ScheduleFoodEditModals = ({ item, initialStep = 'idle', onClose }: Props) => {
  const { toProduct, toDish } = useAppRoutes();
  const {
    step,
    setStep,
    draft,
    setDraft,
    handleFocusCapture,
    handleTimeFinish,
    handleFoodSelect,
    handleCommit,
    handleClose,
    quantityContent,
    inputIds: { TIME_INPUT, SEARCH_INPUT, QUANTITY_INPUT, DETAILS_INPUT },
  } = useScheduleFoodFlow({ type: 'edit', item, initialStep, onClose });

  const goToStep = (target: typeof step) => setStep(target);

  return (
    <div>
      {/* Time */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <ModalShell>
            <ModalShell.Body>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId={TIME_INPUT}
              />
              <ModalShell.ActionButtons
                left={<ModalPrevButton onClick={handleClose} />}
                right={<ModalNextButton onClick={handleCommit} />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Search Food */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'search'}
        content={
          <SearchFood
            onBack={handleClose}
            mode="products-and-dishes"
            onSelectFood={handleFoodSelect}
            onInfoClick={async (variant, id) => {
              await popOverlayEntry();
              if (variant === 'product') toProduct(id);
              else toDish(id);
            }}
            activeItemId={draft.productId ?? draft.dishId ?? undefined}
            inputId={SEARCH_INPUT}
            initialSearchQuery={draft.foodName ?? undefined}
            bottomLeft={
              <DetailsNoteButton htmlFor={DETAILS_INPUT} hasDetails={!!draft.details} />
            }
          />
        }
      />

      {/* Quantity */}
      <ModalByLabel
        position="absolute"
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
                left={<ModalPrevButton onClick={handleClose} />}
                right={<ModalNextButton onClick={handleCommit} />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Details (optional, side-step) */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'details'}
        content={
          <ModalShell>
            <ModalShell.Body>
              <ModalShell.Title>Заметка о еде</ModalShell.Title>
              <Textarea
                id={DETAILS_INPUT}
                value={draft.details}
                onChange={(value) => setDraft((d) => ({ ...d, details: value }))}
                placeholder="Заметка к записи..."
                rows={3}
                maxLength={500}
              />
              <ModalShell.ActionButtons
                left={<ModalPrevButton onClick={() => goToStep('search')} />}
                right={<ModalNextButton onClick={handleCommit} />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />
    </div>
  );
};

export default ScheduleFoodEditModals;
