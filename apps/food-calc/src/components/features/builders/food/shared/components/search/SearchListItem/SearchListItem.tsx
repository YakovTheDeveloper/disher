import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import styles from './SearchListItem.module.scss';

type Props = {
  children: React.ReactNode;
  after?: React.ReactNode; // Buttons or extra info
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

const SearchListItem = ({ children, after, active, onClick, className }: Props) => {
  return (
    <div
      className={clsx(className, styles.listItem, active && styles.listItem_active)}
      onClick={onClick}
    >
      <div className={styles.content}>{children}</div>
      {after && <div className={styles.after}>{after}</div>}
    </div>
  );
};

export default observer(SearchListItem);
