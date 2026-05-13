import { useCallback } from 'react';
import clsx from 'clsx';
import { modalStore, type BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { useUserNormItems, USER_NORM_NAME } from '@/entities/daily-norm';
import NutrientDesignVariants from '@/widgets/nutrients/FoodsNutrients/NutrientDesignVariants';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import CreateDailyNormModal from './CreateDailyNormModal';
import styles from './EditDailyNormModal.module.scss';

// chrome:
//   'modal' (default) — full modal with ModalLayout, kicker+title header,
//                       and the bottom Close button.
//   'panel' — inline content for a drawer that already provides its own
//             header/back. Skips ModalLayout, kicker+title, and the
//             Close button. `onRecalc`: when provided, called instead of
//             opening CreateDailyNormModal on top (used by the drawer
//             two-state to swap to the 'create' panel).
type Props = BaseModalProps & {
  chrome?: 'modal' | 'panel';
  onRecalc?: () => void;
};

const ZERO_VALUE = () => 0;

const EditDailyNormModal = ({ onClose, chrome = 'modal', onRecalc }: Props) => {
  const userItems = useUserNormItems();

  const handleRecalc = useCallback(() => {
    if (onRecalc) {
      // Panel mode (inside a drawer two-state) — parent switches to its
      // own 'create' panel instead of stacking a modal on top.
      onRecalc();
      return;
    }
    onClose();
    void modalStore.show(CreateDailyNormModal, {});
  }, [onClose, onRecalc]);

  const isPanel = chrome === 'panel';
  const isLoading = userItems === undefined;

  const content = (
    <div className={clsx(styles.root, isPanel && styles.rootPanel)}>
      {!isPanel && (
        <div className={clsx(styles.header)}>
          <div className={styles.titleWrap}>
            <span className={styles.kicker}>Дневная норма</span>
            <span className={styles.title}>{USER_NORM_NAME}</span>
          </div>
        </div>
      )}
      <div className={clsx(styles.body, isPanel && styles.bodyPanel)}>
        {isLoading ? (
          <div className={styles.loadingState} aria-live="polite">
            <Spinner size={20} />
            <span className={styles.loadingText}>Загружаем норму…</span>
          </div>
        ) : (
          <NutrientDesignVariants
            variant="view-norms"
            getValue={ZERO_VALUE}
          />
        )}
      </div>
      <div className={clsx(styles.footer, isPanel && styles.footerPanel)}>
        <button
          className={styles.recalcBtn}
          onClick={handleRecalc}
          type="button"
        >
          Пересчитать по анкете
        </button>
        {!isPanel && (
          <button
            className={styles.closeBtn}
            onClick={onClose}
            type="button"
          >
            Закрыть
          </button>
        )}
      </div>
    </div>
  );

  return isPanel ? content : <ModalLayout>{content}</ModalLayout>;
};

export default EditDailyNormModal;
