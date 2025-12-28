import { observer } from 'mobx-react-lite';
import styles from './ScreenScroll.module.scss';
type Props = {
  children: React.ReactNode;
};

const ScreenScroll = ({ children }: Props) => {
  return <div className={styles.screenScroll}>{children}</div>;
};

export default observer(ScreenScroll);
