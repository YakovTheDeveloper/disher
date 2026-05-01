import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';
import { DetailsNoteButton } from '@/features/shared/components/DetailsNoteButton';

import type { ScheduleFoodFlow } from './useScheduleFoodFlow';

type Props = {
  flow: ScheduleFoodFlow;
};

const ScheduleFoodEditModals = ({ flow }: Props) => {
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
  } = flow;

  const goToStep = (target: typeof step) => setStep(target);

  return (
    <div onFocusCapture={handleFocusCapture}>
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
            onInfoClick={() => {
              handleClose();
            }}
            activeItemId={draft.productId ?? draft.dishId ?? undefined}
            inputId={SEARCH_INPUT}
            initialSearchQuery={draft.foodName ?? undefined}
            bottomLeft={<DetailsNoteButton htmlFor={DETAILS_INPUT} hasDetails={!!draft.details} />}
            isActive={step === 'search'}
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
                isActive={step === 'quantity'}
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
              <ModalShell.Title>Уточнение к приему пищи</ModalShell.Title>
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
