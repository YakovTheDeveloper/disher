import type { ReactNode, ButtonHTMLAttributes } from 'react';
import styles from './IconButton.module.scss';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  badge?: ReactNode;
};

const IconButton = ({ icon, badge, children, className, ...rest }: Props) => {
  return (
    <button type="button" className={`${styles.root} ${className ?? ''}`} {...rest}>
      {badge && <span className={styles.badge}>{badge}</span>}
      <span className={styles.icon}>{icon}</span>
      {children && <span className={styles.label}>{children}</span>}
    </button>
  );
};

export default IconButton;
