import { observer } from 'mobx-react-lite';
import styles from './ModalConfirmation.module.scss';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { ConfirmationModalDataType as ConfirmationModalDataInstance } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { domainStore } from '@/store/store';

type Props = {
  modalStore: ModalStoreInstance;
  data: ConfirmationModalDataInstance;
};

const ModalConfirmation = ({ modalStore, data }: Props) => {
  const ids = domainStore.globalUiStore.selectedIds;
  // schedule.foods.removeChildren(ids);

  domainStore.globalUiStore.clearSelection();

  return (
    <div className={styles.content}>
      <h2>Подтвердите действие</h2>
      <p>Вы уверены, что хотите {data.action}</p>
      <div className={styles.actions}>
        <button onClick={modalStore.closeModal} className={styles.cancel}>
          Отменить
        </button>
        <button onClick={modalStore.confirmCurrentModal} className={styles.confirm}>
          Подтвердить
        </button>
      </div>
    </div>
  );
};

export default observer(ModalConfirmation);
