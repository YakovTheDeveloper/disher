import { observer } from 'mobx-react-lite';
import styles from './Label.module.scss';
type Props = {
  children: React.ReactNode;
  aside: React.ReactNode;
};

const Label = ({ children, aside }: Props) => {
  return (
    <label className={styles.label}>
      <div className={styles.inner}>{children}</div>
      {aside && <div className={styles.aside}>{aside}</div>}
    </label>
  );
};

export default observer(Label);
