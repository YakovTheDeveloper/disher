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
import { InfoIcon } from '@/shared/ui/atoms/icons/InfoIcon';
import { STEP_LABELS, type FoodEntryFlow, type DishEditItem } from './useFoodEntryFlow';
import s from './FoodEntryEditModals.module.scss';

type Props = {
  /** Edit-флоу, поднятый страницей (useFoodEntryFlow({ mode: 'edit', target })). */
  flow: FoodEntryFlow;
};

const FoodEntryEditModals = ({ flow }: Props) => {
  const navigate = useNavigate();
  const {
    kind,
    step,
    draft,
    setDraft,
    editingItem,
    handleFocusCapture,
    handleTimeFinish,
    handleCommit,
    handleClose,
    quantityContent,
    inputIds: { QUANTITY_INPUT, DETAILS_INPUT, TIME_INPUT },
  } = flow;

  // info-таргет (ⓘ в шапке деталей) — только у расписания: продукт → боковой
  // ProductDrawer, блюдо → страница блюда. У ингредиента блюда такого нет.
  const infoTarget =
    kind === 'schedule'
      ? (() => {
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
        })()
      : null;

  const detailsTitle =
    kind === 'schedule'
      ? draft.foodName
        ? draft.foodName.charAt(0).toUpperCase() + draft.foodName.slice(1)
        : STEP_LABELS.details
      : ((editingItem as DishEditItem | null)?.product?.name ?? 'Уточнение к ингредиенту');

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Edit-флоу блюда не меняет сам продукт: из строки ингредиента тап по
          имени ведёт в детали, по количеству — в количество. Смены продукта
          (search-шаг) тут нет — он был недостижимым мёртвым кодом, снят
          2026-06-21. Сменить продукт = удалить ингредиент и добавить заново. */}

      {/* Time — только расписание. */}
      {kind === 'schedule' && (
        <ModalByLabel
          position="absolute"
          isExpanded={step === 'time'}
          content={
            <ModalShell>
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
      )}

      {/* Quantity */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <ModalShell>
            <ModalShell.Header title={STEP_LABELS.quantity} onBack={handleClose} />
            <ModalShell.Body>
              {editingItem && (
                <>
                  <ProductQuantity
                    content={quantityContent}
                    onFinish={() => {}}
                    inputId={QUANTITY_INPUT}
                    isActive={step === 'quantity'}
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

      {/* Details — entry point in edit = tap-on-name on a row. */}
      <ModalByLabelDetails
        isExpanded={step === 'details'}
        flush={kind === 'schedule'}
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
              <InfoIcon size={20} aria-hidden />
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

export default FoodEntryEditModals;
