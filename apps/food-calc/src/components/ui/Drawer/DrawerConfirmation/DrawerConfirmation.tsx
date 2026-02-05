import { observer } from 'mobx-react-lite';
import styles from './DrawerConfirmation.module.scss';
import { ConfirmationActions } from '@/store/GlobalUiStore/DrawerStore/confirmationActions';
import { useIdFromUrl } from '@/context/useUrlParamsIdContext';

export interface ConfirmationPayload {
  title?: string;
  message?: string;
}

type Props = {
  payload?: ConfirmationPayload;
  drawerType?: string;
  onClose?: () => void;
};

const DrawerConfirmation = ({ payload, onClose, drawerType }: Props) => {
  const id = useIdFromUrl();
  const handleConfirm = () => {
    if (drawerType) ConfirmationActions[drawerType as keyof typeof ConfirmationActions]?.(id);
  };

  return (
    <div className={styles.content}>
      <h2>{payload?.title ?? 'Подтвердите действие'}</h2>
      <p>{payload?.message ?? 'Вы уверены, что хотите выполнить это действие?'}</p>
      <div className={styles.actions}>
        <button onClick={onClose} className={styles.cancel}>
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
