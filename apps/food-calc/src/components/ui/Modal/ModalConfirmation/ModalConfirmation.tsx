import { observer } from 'mobx-react-lite';
import styles from './ModalConfirmation.module.scss';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { ConfirmationModalDataType as ConfirmationModalDataInstance } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { domainStore } from '@/store/store';
import { useConfirm } from '@/context/modalConfirmationContext';

type Props = {
  modalStore?: ModalStoreInstance;
  data: ConfirmationModalDataInstance;
  onConfirm: () => void;
};

const ModalConfirmation = ({
  modalStore = domainStore.globalUiStore.modalStore,
  data,
  onConfirm,
}: Props) => {
  const ids = domainStore.interactionsService.interactionsSelect.selectedIds;
  // schedule.foods.removeChildren(ids);

  // domainStore.interactionsService.interactionsSelect.clearSelection();

  return (
    <div className={styles.content}>
      <h2>Подтвердите действие</h2>
      <p>Вы уверены, что хотите {data.action}</p>
      <div className={styles.actions}>
        <button onClick={modalStore.closeModal} className={styles.cancel}>
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
