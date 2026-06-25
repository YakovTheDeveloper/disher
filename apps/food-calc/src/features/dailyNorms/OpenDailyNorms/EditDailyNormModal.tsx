import { useCallback } from 'react';
import clsx from 'clsx';
import { modalStore, type BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { useUserNormItems, USER_NORM_NAME } from '@/entities/daily-norm';
import { NutrientTable } from '@/widgets/nutrients/FoodsNutrients';
import Button from '@/shared/ui/atoms/Button/Button';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import ArrowLeftIcon from '@/shared/assets/icons/arrowLeftLong.svg?react';
import CreateDailyNormModal from './CreateDailyNormModal';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import styles from './EditDailyNormModal.module.scss';

// chrome:
//   'modal' (default) — full modal with ModalLayout, title header,
//                       and the bottom Close button.
//   'panel' — inline content for a drawer that already provides its own
//             header/back. Skips ModalLayout, the title header, and the
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
          <button
            type="button"
            className={styles.backButton}
            onClick={onClose}
            aria-label="Назад"
          >
            <ArrowLeftIcon />
          </button>
          <div className={styles.titleWrap}>
            <Heading as="span" role="headline" className={styles.title}>{USER_NORM_NAME}</Heading>
          </div>
        </div>
      )}
      <div className={clsx(styles.body, isPanel && styles.bodyPanel)}>
        {isLoading ? (
          <div className={styles.loadingState} aria-live="polite">
            <Spinner size={20} />
            <Text as="span" role="caption" className={styles.loadingText}>Загружаем норму…</Text>
          </div>
        ) : (
          <NutrientTable
            variant="view-norms"
            getValue={ZERO_VALUE}
          />
        )}
      </div>
      {/* Парящая ActionBar-кнопка справа-снизу (sticky над контентом). */}
      <div className={clsx(styles.recalcBar, isPanel && styles.recalcBarFloat)}>
        <Button
          variant="brand"
          onClick={handleRecalc}
          icon={<span className={styles.recalcGlyph}>↻</span>}
        >
          Пересчитать по анкете
        </Button>
      </div>
    </div>
  );

  return isPanel ? content : <ModalLayout>{content}</ModalLayout>;
};

export default EditDailyNormModal;
