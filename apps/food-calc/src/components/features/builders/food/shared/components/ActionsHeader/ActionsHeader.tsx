import { observer } from 'mobx-react-lite';
import { domainStore } from '@/store/store';
import ArrowLeftIcon from '@/assets/icons/arrowLeftLong.svg';
import styles from './ActionsHeader.module.scss';

const exitActions = () => {
  domainStore.globalUiStore.clearSelection();
};

const ActionsHeader = () => {
  if (!domainStore.globalUiStore.isActionsMode) return null;

  const { modalStore } = domainStore.globalUiStore;

  const onDeleteButtonClick = () => {
    modalStore.openConfirmationModal({
      action: 'удалить выбранное?',
    });
  };

  const onCreateDishButtonClick = () => {
    modalStore.openCreateDishFromScheduleModal();
  };

  const onCopyToAnotherDayButtonClick = () => {
    modalStore.openCopyScheduleItemsToAnotherDayModal();
  };

  return (
    <div className={styles.actions}>
      <div className={styles.actionsGroup}>
        <button onClick={exitActions}>
          <ArrowLeftIcon />
        </button>
        <button onClick={onDeleteButtonClick}>Удалить</button>
      </div>
      <div className={styles.actionsGroup}>
        <button onClick={onCreateDishButtonClick}>создать новое блюдо</button>
        <button onClick={onCopyToAnotherDayButtonClick}>перенести еду в другой день</button>
      </div>
    </div>
  );
};

export default observer(ActionsHeader);
