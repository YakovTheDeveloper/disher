import { observer } from 'mobx-react-lite';
import styles from './ModalConfirmDeleteDishes.module.scss';
import { ModalConfirmation } from '@/components/ui/Modal/ModalConfirmation';
import { domainStore } from '@/store/store';

const ModalConfirmDeleteDishes = () => {
  const onConfirm = () => {
    const selectedIds = domainStore.interactionsService.interactionsSelect.selectedIds;
    domainStore.dishStore.user.removeBulk(selectedIds);
    domainStore.globalUiStore.modalStore.closeModal();
    domainStore.interactionsService.interactionsSelect.clearSelection();
  };

  return <ModalConfirmation onConfirm={onConfirm} data={{ action: 'удалить выбранные блюда' }} />;
};

export default observer(ModalConfirmDeleteDishes);
