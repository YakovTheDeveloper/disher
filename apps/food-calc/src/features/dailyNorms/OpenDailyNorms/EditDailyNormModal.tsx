import { useCallback } from 'react';
import clsx from 'clsx';
import { modalStore, type BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
import { useUserNormItems, USER_NORM_NAME } from '@/entities/daily-norm';
import { NutrientTable } from '@/widgets/nutrients/FoodsNutrients';
import Button from '@/shared/ui/atoms/Button/Button';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import CreateDailyNormModal from './CreateDailyNormModal';
import { Text } from '@/shared/ui/atoms/Typography';
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

  const bodyContent = isLoading ? (
    <div className={styles.loadingState} aria-live="polite">
      <Spinner size={20} />
      <Text as="span" role="caption" className={styles.loadingText}>Загружаем норму…</Text>
    </div>
  ) : (
    <NutrientTable variant="view-norms" getValue={ZERO_VALUE} />
  );

  const recalcButton = (
    <Button
      variant="system"
      onClick={handleRecalc}
      icon={<span className={styles.recalcGlyph}>↻</span>}
    >
      Пересчитать по анкете
    </Button>
  );

  // Panel mode — inline body inside a drawer that already owns header + scroll.
  // The recalc action floats sticky bottom-right over the drawer's own scroller.
  if (isPanel) {
    return (
      <div className={clsx(styles.root, styles.rootPanel)}>
        <div className={clsx(styles.body, styles.bodyPanel)}>{bodyContent}</div>
        <div className={clsx(styles.recalcBar, styles.recalcBarFloat)}>{recalcButton}</div>
      </div>
    );
  }

  // Modal mode — canonical ModalShell chrome. The recalc action rides the fixed
  // ActionButtons footer (pinned above content, above the keyboard).
  return (
    <ModalLayout a11yLabel={USER_NORM_NAME}>
      <ModalShell>
        <ModalShell.Header title={USER_NORM_NAME} onBack={onClose} />
        <ModalShell.Body>
          {bodyContent}
          <ModalShell.Spacer />
          <ModalShell.ActionButtons debugId="daily-norm-edit" right={recalcButton} />
        </ModalShell.Body>
      </ModalShell>
    </ModalLayout>
  );
};

export default EditDailyNormModal;
