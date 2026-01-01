import { observer } from 'mobx-react-lite';
import styles from './SearchListItem.module.scss';
import clsx from 'clsx';

type Props = {
  children: React.ReactNode;
  after?: React.ReactNode; // Buttons or extra info
  active?: boolean;
  onClick?: () => void;
  onInfoClick?: () => void;
  style?: React.CSSProperties;
  className: string;
  item: { name: string; label?: string };
};

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1" fill="currentColor" />
  </svg>
);

const SearchListItem = ({ onInfoClick, item, after, active, onClick, className, style }: Props) => {
  return (
    <li className={styles.searchListItemWrapper}>
      {onInfoClick && (
        <span className={styles.before} onClick={onInfoClick}>
          <InfoIcon />
        </span>
      )}
      <p
        className={clsx(className, styles.listItem, active && styles.listItem_active)}
        onClick={onClick}
        style={style}
      >
        {item && <p className="ellipsis"> {item.name || item.label}</p>}

        {/* <div className={styles.content}>{children}</div> */}
        {after && <div className={styles.after}>{after}</div>}
      </p>
    </li>
  );
};

export default observer(SearchListItem);
