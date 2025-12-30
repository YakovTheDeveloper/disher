import { observer } from 'mobx-react-lite';
import styles from './DrawerLayout.module.scss';
type Props = {
  children: React.ReactNode;
  label: React.ReactNode;
  tabs: React.ReactNode;
  bottom?: React.ReactNode;
};

const DrawerLayout = ({ children, label, tabs, bottom }: Props) => {
  return (
    <>
      <div className={styles.title}>{label}</div>
      <div className={styles.container}>
        <header className={styles.header}>{tabs}</header>
        {children}
      </div>
      <div className={styles.bottom}>{bottom}</div>
    </>
  );
};

export default observer(DrawerLayout);
