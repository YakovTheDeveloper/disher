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
  onInfoClick?: () => void;
  style?: React.CSSProperties;
  className: string;
  item: { name: string; label?: string };
};

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.2" />
    <text
      x="10.5"
      y="15"
      textAnchor="middle"
      fontStyle="italic"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="13"
      fill="currentColor"
    >
      i
    </text>
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
      {onInfoClick && (
        <button className={styles.infoButton} onClick={onInfoClick} type="button">
          <InfoIcon />
        </button>
      )}
    </li>
  );
};

export default observer(SearchListItem);
