import { observer } from 'mobx-react-lite';
import styles from './AddListItemButton.module.scss';

type Props = {
  children?: React.ReactNode;
};

const AddListItemButton = ({ children }: Props) => {
  return (
    <button type="button" className={styles.container} aria-label="Add item">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="3" y="3" width="18" height="18" rx="4" fill="#9CA3AF" />
        <path d="M12 7V17M7 12H17" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {children}
    </button>
  );
};

export default observer(AddListItemButton);
