import { observer } from 'mobx-react-lite';
import styles from './Label.module.scss';
type Props = {
  children: React.ReactNode;
};

const Label = ({ children }: Props) => {
  return <label className={styles.label}>{children}</label>;
};

export default observer(Label);
