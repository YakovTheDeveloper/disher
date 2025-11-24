import { observer } from 'mobx-react-lite';
import styles from './ItemsList.module.scss';
type Props = {
  children: React.ReactNode;
};

const ItemsList = ({ children }: Props) => {
  return <ul className={styles.container}>{children}</ul>;
};

export default observer(ItemsList);
