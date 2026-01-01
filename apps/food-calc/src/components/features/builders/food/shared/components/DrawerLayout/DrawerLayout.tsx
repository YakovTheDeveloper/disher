import { observer } from 'mobx-react-lite';
import styles from './DrawerLayout.module.scss';
type Props = {
  children: React.ReactNode;
  label: React.ReactNode;
  tabs: React.ReactNode;
  sub?: React.ReactNode;
  bottom?: React.ReactNode;
};

const DrawerLayout = ({ children, label, tabs, bottom, sub }: Props) => {
  return (
    <>
      <div className={styles.title}>{label}</div>
      <header className={styles.header}>{tabs}</header>
      <div className={styles.container}>
        {/* {sub && <header className={styles.subHeader}>{sub}</header>} */}
        {children}
      </div>
      <div className={styles.bottom}>{bottom}</div>
    </>
  );
};

export default observer(DrawerLayout);
