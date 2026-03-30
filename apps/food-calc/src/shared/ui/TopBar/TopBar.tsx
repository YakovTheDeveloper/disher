import { SyncIndicator } from '@/shared/ui/SyncIndicator/SyncIndicator';
import styles from './TopBar.module.scss';

type Props = {
  children?: React.ReactNode;
  right?: React.ReactNode;
};

const TopBar = ({ children, right }: Props) => {
  return (
    <div className={styles.topBar}>
      {children}
      {right}
      <SyncIndicator />
    </div>
  );
};

export default TopBar;
