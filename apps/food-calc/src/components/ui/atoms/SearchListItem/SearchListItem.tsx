import { observer } from 'mobx-react-lite';
import styles from './SearchListItem.module.scss';
import clsx from 'clsx';

type Props = {
  children?: React.ReactNode;
  iconElement?: React.ReactNode;
  decorativeAfterElement?: React.ReactNode | string; // Buttons, extra info, or icon class name
  actionBeforeElement?: React.ReactNode; // Buttons or extra info
  active?: boolean;
  onClick?: () => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLElement>) => void;
  onInfoClick?: (id: string) => void;
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

const SearchListItem = ({
  onInfoClick,
  item,
  decorativeAfterElement,
  actionBeforeElement,
  active,
  onClick,
  onTouchEnd,
  className,
  style,
}: Props) => {
  return (
    <li className={styles.searchListItemWrapper}>
      {actionBeforeElement}
      <p
        className={clsx(className, styles.listItem, active && styles.listItem_active)}
        onClick={onClick}
        onTouchEnd={onTouchEnd}
        style={style}
      >
        {item.name || item.label}
        {decorativeAfterElement}
      </p>
    </li>
  );
};

export default observer(SearchListItem);
