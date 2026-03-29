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
    </div>
  );
};

export default TopBar;
