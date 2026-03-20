import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { BaseDrawerProps } from '@/shared/ui';
import styles from './DeleteConfirmationModal.module.scss';

interface Props extends BaseDrawerProps<boolean> {
  count: number;
}

const DeleteConfirmationModal = ({ onClose, count }: Props) => {
  return (
    <DrawerLayout>
      <div className={styles.header}>
        <span className={styles.name}>Удалить?</span>
        <span className={styles.description}>
          {count === 1
            ? 'Удалить выбранный элемент из расписания?'
            : `Удалить ${count} элементов из расписания?`}
        </span>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.actionBtn} onClick={() => onClose()}>
          <CancelIcon />
          Отмена
        </button>
        <button type="button" className={`${styles.actionBtn} ${styles.destructive}`} onClick={() => onClose(true)}>
          <TrashIcon />
          Удалить
        </button>
      </div>
    </DrawerLayout>
  );
};

const CancelIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default DeleteConfirmationModal;
