import { useNavigate } from 'react-router-dom';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalByLabelDetails } from '@/features/shared/components/ModalByLabelDetails';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { DetailsStep } from '@/features/food/details-chips';
import { RouterUrls } from '@/app/router';
import { pushNavigate } from '@/shared/lib/viewTransition';
import { drawerStore } from '@/shared/ui/drawer-store';
import { ProductDrawer } from '@/features/food/product-drawer';

import { STEP_LABELS, type ScheduleFoodFlow } from './useScheduleFoodFlow';
import s from './ScheduleFoodEditModals.module.scss';

type Props = {
  flow: ScheduleFoodFlow;
};

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.75" />
    <text
      x="12"
      y="17"
      textAnchor="middle"
      fill="currentColor"
      fontFamily="'Source Serif 4', 'Source Serif Pro', Georgia, serif"
      fontStyle="italic"
      fontSize="16"
      fontWeight="300"
    >
      i
    </text>
  </svg>
);

const ScheduleFoodEditModals = ({ flow }: Props) => {
  const navigate = useNavigate();
  const {
    step,
    draft,
    setDraft,
    handleFocusCapture,
    handleTimeFinish,
    handleCommit,
    handleClose,
    quantityContent,
    inputIds: { TIME_INPUT, QUANTITY_INPUT, DETAILS_INPUT },
  } = flow;

  const infoTarget = (() => {
    if (draft.variant === 'dish' && draft.dishId) {
      const dishId = draft.dishId;
      return {
        label: 'Информация о блюде',
        onClick: () => {
          handleClose();
          pushNavigate(navigate, RouterUrls.getDish(dishId), 'push');
        },
      };
    }
    if (draft.variant === 'product' && draft.productId) {
      // Продукт (свой и каталожный) → боковой ProductDrawer; страница
      // /product/:id инактивирована. Имя для шапки берём из draft.foodName.
      const productId = draft.productId;
      const productName = draft.foodName ?? undefined;
      return {
        label: 'Информация о продукте',
        onClick: () => {
          handleClose();
          drawerStore.show(
            ProductDrawer,
            { productId, productName },
            { side: 'left', width: 'min(85vw, 360px)' },
          );
        },
      };
    }
    return null;
  })();

  const detailsTitle = draft.foodName
    ? draft.foodName.charAt(0).toUpperCase() + draft.foodName.slice(1)
    : STEP_LABELS.details;

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Time */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <ModalShell variant="spring4">
            <ModalShell.Header title={STEP_LABELS.time} onBack={handleClose} />
            <ModalShell.Body>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId={TIME_INPUT}
              />
              <ModalShell.ActionButtons
                right={<ModalNextButton onClick={handleCommit} variant="finish" />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Quantity */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <ModalShell variant="spring4">
            <ModalShell.Header title={STEP_LABELS.quantity} onBack={handleClose} />
            <ModalShell.Body>
              <ProductQuantity
                content={quantityContent}
                onFinish={() => {}}
                inputId={QUANTITY_INPUT}
                isActive={step === 'quantity'}
              />
              <ModalShell.ActionButtons
                right={<ModalNextButton onClick={handleCommit} variant="finish" />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Details — entry point in edit is now tap-on-name on a schedule-food row */}
      <ModalByLabelDetails
        isExpanded={step === 'details'}
        variant="spring4"
        flush
        onCommit={handleCommit}
        title={detailsTitle}
        onBack={handleClose}
        trailing={
          infoTarget ? (
            <button
              type="button"
              className={s.infoBtn}
              aria-label={infoTarget.label}
              onClick={infoTarget.onClick}
            >
              <InfoIcon />
            </button>
          ) : undefined
        }
      >
        <DetailsStep
          foodName={draft.foodName ?? null}
          textareaId={DETAILS_INPUT}
          value={draft.details}
          onChange={(value) => setDraft((d) => ({ ...d, details: value }))}
          productId={draft.productId}
        />
      </ModalByLabelDetails>
    </div>
  );
};

export default ScheduleFoodEditModals;
