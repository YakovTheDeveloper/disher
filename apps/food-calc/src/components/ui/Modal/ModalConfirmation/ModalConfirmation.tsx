import { observer } from 'mobx-react-lite';
import styles from './ModalConfirmation.module.scss';
import { domainStore } from '@/store/store';

interface ConfirmationData {
  action: string;
}

type Props = {
  data: ConfirmationData;
  onConfirm: () => void;
  onClose: () => void;
};

const ModalConfirmation = ({ data, onConfirm, onClose }: Props) => {
  return (
    <div className={styles.content}>
      <h2>Подтвердите действие</h2>
      <p>Вы уверены, что хотите {data.action}</p>
      <div className={styles.actions}>
        <button onClick={onClose} className={styles.cancel}>
          Отменить
        </button>
        <button onClick={onConfirm} className={styles.confirm}>
          Подтвердить
        </button>
      </div>
    </div>
  );
};

export default observer(ModalConfirmation);
