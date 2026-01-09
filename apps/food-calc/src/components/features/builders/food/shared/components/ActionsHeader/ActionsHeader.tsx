import { observer } from 'mobx-react-lite';
import { domainStore } from '@/store/store';
import ArrowLeftIcon from '@/assets/icons/arrowLeftLong.svg';
import styles from './ActionsHeader.module.scss';

const exitActions = () => {
  domainStore.globalUiStore.clearSelection();
};

type Props = {
  onDelete: (childIds: string[]) => void;
};

const ActionsHeader = ({ onDelete }: Props) => {
  if (!domainStore.globalUiStore.isActionsMode) return null;

  const onDeleteHandler = () => {
    onDelete(domainStore.globalUiStore.selectedIds);
  };

  return (
    <div className={styles.actions}>
      <button onClick={exitActions}>
        <ArrowLeftIcon />
      </button>
      <button onClick={onDeleteHandler}>Удалить</button>
    </div>
  );
};

export default observer(ActionsHeader);
