import { observer } from 'mobx-react-lite';
import styles from './DrawerConfirmation.module.scss';
import { ConfirmationActions } from '@/store/GlobalUiStore/DrawerStore/confirmationActions';

export interface ConfirmationPayload {
  title?: string;
  message?: string;
}

type Props = {
  payload?: ConfirmationPayload;
  onClose: () => void;
  drawerType?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

const DrawerConfirmation = ({ payload, onClose, drawerType, onConfirm, onCancel }: Props) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else if (drawerType) {
      ConfirmationActions[drawerType as keyof typeof ConfirmationActions]?.();
    }
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <div className={styles.content}>
      <h2>{payload?.title ?? 'Подтвердите действие'}</h2>
      <p>{payload?.message ?? 'Вы уверены, что хотите выполнить это действие?'}</p>
      <div className={styles.actions}>
        <button onClick={handleCancel} className={styles.cancel}>
          Отменить
        </button>
        <button onClick={handleConfirm} className={styles.confirm}>
          Подтвердить
        </button>
      </div>
    </div>
  );
};

export default observer(DrawerConfirmation);
