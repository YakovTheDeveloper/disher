import clsx from 'clsx';
import styles from './ScrollIndicator.module.scss';

type Props = {
  visible: boolean;
  variant?: 'light' | 'dark';
};

export const ScrollIndicator = ({ visible, variant = 'light' }: Props) => (
  <div className={clsx(styles.indicator, styles[variant], visible && styles.visible)} />
);
