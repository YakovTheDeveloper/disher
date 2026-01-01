import { observer } from 'mobx-react-lite';
import styles from './Screen.module.scss';
type Props = {
  children: React.ReactNode;
  bottom: React.ReactNode;
};

const Screen = ({ children, bottom }: Props) => {
  return (
    <div className={styles.screen}>
      {children}
      <div className={styles.bottom}>{bottom}</div>
    </div>
  );
};

export default observer(Screen);
