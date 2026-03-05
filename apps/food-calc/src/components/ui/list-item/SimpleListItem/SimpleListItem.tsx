import { observer } from 'mobx-react-lite';
import styles from './SimpleListItem.module.scss';

type Props = {
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
};

const SimpleListItem = ({ children, rightSlot }: Props) => {
  return (
    <div className={styles.container}>
      {children}
      {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
    </div>
  );
};

export default observer(SimpleListItem);
