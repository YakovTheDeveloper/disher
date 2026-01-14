import { observer } from 'mobx-react-lite';
import { domainStore } from '@/store/store';
import ArrowLeftIcon from '@/assets/icons/arrowLeftLong.svg';
import styles from './ActionsHeader.module.scss';

const exitActions = () => {
  domainStore.globalUiStore.clearSelection();
};
type Props = {
  children?: React.ReactNode;
  left?: React.ReactNode;
};
const ActionsHeader = ({ children, left }: Props) => {
  if (!domainStore.globalUiStore.isActionsMode) return null;

  return (
    <div className={styles.actions}>
      <div className={styles.actionsGroup}>
        <button onClick={exitActions}>
          <ArrowLeftIcon />
        </button>
        {left}
      </div>
      {children && <div className={styles.actionsGroup}>{children}</div>}
    </div>
  );
};

export default observer(ActionsHeader);
