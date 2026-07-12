import { useCallback } from 'react';
import clsx from 'clsx';
import { modalStore, type BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
import { useUserNormItems, USER_NORM_NAME } from '@/entities/daily-norm';
import { NutrientNormView } from '@/entities/nutrient/ui/NutrientNormView';
import Button from '@/shared/ui/atoms/Button/Button';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import CreateDailyNormModal from './CreateDailyNormModal';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './EditDailyNormModal.module.scss';

// chrome:
//   'modal' (default) — full modal with ModalLayout, title header,
//                       and the bottom Close button. The recalc action rides
//                       the ActionButtons footer and opens CreateDailyNormModal
//                       stacked on top.
//   'panel' — inline body ONLY, for a drawer that already provides its own
//             header/back AND owns the «Пересчитать по анкете» action in its
//             pinned footer (DailyNormDrawer). Skips ModalLayout, title header,
//             Close, and the recalc button — the drawer renders that below the
//             scroll area so the scroll-fade mask never dims it.
type Props = BaseModalProps & {
  chrome?: 'modal' | 'panel';
};

const EditDailyNormModal = ({ onClose, chrome = 'modal' }: Props) => {
  const userItems = useUserNormItems();

  const handleRecalc = useCallback(() => {
    onClose();
    void modalStore.show(CreateDailyNormModal, {});
  }, [onClose]);

  const isPanel = chrome === 'panel';
  const isLoading = userItems === undefined;

  const bodyContent = isLoading ? (
    <div className={styles.loadingState} aria-live="polite">
      <Spinner size={20} />
      <Text as="span" role="caption" className={styles.loadingText}>Загружаем норму…</Text>
    </div>
  ) : (
    <NutrientNormView />
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
  // «Пересчитать по анкете» lives in the drawer's pinned footer (DailyNormDrawer),
  // NOT here — keeping it out of this scroll body means the scroll-fade mask can't
  // dim it, so no sticky-above-the-fade lift is needed.
  if (isPanel) {
    return (
      <div className={clsx(styles.root, styles.rootPanel)}>
        <div className={clsx(styles.body, styles.bodyPanel)}>{bodyContent}</div>
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
