import { observer } from 'mobx-react-lite';
import styles from './Screen.module.scss';
type Props = {
  children: React.ReactNode;
};

const Screen = ({ children }: Props) => {
  return <div className={styles.screen}>{children}</div>;
};

export default observer(Screen);
