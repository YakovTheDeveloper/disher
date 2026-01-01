import { observer } from 'mobx-react-lite';
import styles from './QuickButton.module.scss';
type Props = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  isActive: boolean;
  onClick: (e) => void;
};

const QuickButton = ({ children, className, style, isActive, onClick }: Props) => {
  return (
    <button
      onClick={(e) => onClick(e)}
      className={`${styles.quickButton} ${className || ''} ${isActive && styles.activeButton}`}
      style={style}
    >
      {children}
    </button>
  );
};

export default observer(QuickButton);
