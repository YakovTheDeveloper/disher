import { observer } from 'mobx-react-lite';
import styles from './SearchListItem.module.scss';
import clsx from 'clsx';

type Props = {
  children: React.ReactNode;
  after?: React.ReactNode; // Buttons or extra info
  active?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className: string;
};

const SearchListItem = ({ children, after, active, onClick, className, style }: Props) => {
  return (
    <li
      className={clsx(className, styles.listItem, active && styles.listItem_active)}
      onClick={onClick}
      style={style}
    >
      <div className={styles.content}>{children}</div>
      {after && <div className={styles.after}>{after}</div>}
    </li>
  );
};

export default observer(SearchListItem);
