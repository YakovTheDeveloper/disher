import { observer } from 'mobx-react-lite';
import styles from './StatusMessage.module.scss';
type Props = {
  children: React.ReactNode;
};

const StatusMessage = ({ children }: Props) => {
  return <div className={styles.container}>{children}</div>;
};

export default observer(StatusMessage);
