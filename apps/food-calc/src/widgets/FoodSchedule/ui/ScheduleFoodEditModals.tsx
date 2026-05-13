import { useNavigate } from 'react-router-dom';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { DetailsChips } from '@/features/food/details-chips';
import { getProductUrl, RouterUrls } from '@/app/router';

import type { ScheduleFoodFlow } from './useScheduleFoodFlow';
import styles from './ScheduleFoodEditModals.module.scss';

type Props = {
  flow: ScheduleFoodFlow;
};

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
      return { label: 'Информация о блюде', href: RouterUrls.getDish(draft.dishId) };
    }
    if (draft.variant === 'product' && draft.productId) {
      // Catalog products don't have a user-mutable detail page; route still
      // exists and shows read-only catalog data, so we link to it.
      return { label: 'Информация о продукте', href: getProductUrl(draft.productId) };
    }
    return null;
  })();

  const handleInfoClick = (href: string) => () => {
    handleClose();
    navigate(href);
  };

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

      {/* Details — entry point in edit is now tap-on-name on a schedule-food row */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'details'}
        content={
          <ModalShell>
            <ModalShell.Body>
              <div className={styles.detailsHeader}>
                <ModalShell.Title>
                  {draft.foodName
                    ? `Уточнение: ${draft.foodName}`
                    : 'Уточнение к приему пищи'}
                </ModalShell.Title>
                {infoTarget && (
                  <button
                    type="button"
                    className={styles.infoLink}
                    onClick={handleInfoClick(infoTarget.href)}
                  >
                    {infoTarget.label}
                  </button>
                )}
              </div>
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

export default ScheduleFoodEditModals;
