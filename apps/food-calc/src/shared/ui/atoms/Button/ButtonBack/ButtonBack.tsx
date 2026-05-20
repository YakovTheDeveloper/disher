import ArrowLeftIcon from '@/shared/assets/icons/arrowLeftLong.svg?react';
import styles from './ButtonBack.module.scss';
import clsx from 'clsx';

type Props = {
  children?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
};

const ButtonBack = ({ children, size = 'large', className, onClick }: Props) => {
  return (
    <button className={clsx(styles.container, styles[size], className)} onClick={onClick}>
      <ArrowLeftIcon />
      {children}
    </button>
  );
};

export default ButtonBack;
