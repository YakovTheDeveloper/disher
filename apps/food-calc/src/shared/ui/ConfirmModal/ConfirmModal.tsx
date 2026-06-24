import { memo } from 'react';
import type { BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import styles from './ConfirmModal.module.scss';

// Generic confirm dialog. `modalStore.show(ConfirmModal, {...})` resolves to
// `true` on confirm, `false` on cancel, `undefined` if dismissed by backdrop
// / back-gesture — treat anything other than `true` as "do not proceed".
export type ConfirmModalProps = BaseModalProps<boolean> & {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` paints the confirm button red (destructive actions). */
  tone?: 'default' | 'danger';
};

const ConfirmModal = ({
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  tone = 'default',
  onClose,
}: ConfirmModalProps) => (
  <ModalLayout className={styles.layout} a11yLabel={title}>
    {/* Canonical typography — title via Heading, message via Text(caption). */}
    <Heading role="headline" as="h2">
      {title}
    </Heading>
    <Text role="caption" className={styles.message}>
      {message}
    </Text>
    <div className={styles.actions}>
      <button type="button" className={styles.cancel} onClick={() => onClose(false)}>
        {cancelLabel}
      </button>
      <button
        type="button"
        className={tone === 'danger' ? styles.confirmDanger : styles.confirm}
        onClick={() => onClose(true)}
      >
        {confirmLabel}
      </button>
    </div>
  </ModalLayout>
);

export default memo(ConfirmModal);
