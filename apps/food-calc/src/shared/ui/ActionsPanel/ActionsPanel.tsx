import { observer } from 'mobx-react-lite';
import ArrowLeftIcon from '@/shared/assets/icons/arrowLeftLong.svg';
import styles from './ActionsPanel.module.scss';

type Props = {
  children?: React.ReactNode;
  left?: React.ReactNode;
  show: boolean;
  onBack?: () => void;
};

const ActionsPanel = ({ children, left, show, onBack }: Props) => {
  if (!show) return null;

  return (
    <div className={styles.actions}>
      <div className={styles.actionsGroup}>
        <button onClick={onBack}>
          <ArrowLeftIcon />
        </button>
        {left}
      </div>
      {children && <div className={styles.actionsGroup}>{children}</div>}
    </div>
  );
};

export default observer(ActionsPanel);
