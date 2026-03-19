import { FC } from 'react';
import clsx from 'clsx';
import styles from './BrandMark.module.scss';

type Variant = 'sailboat' | 'wave';

type Props = {
  variant?: Variant;
  size?: number;
  className?: string;
};

const Sailboat: FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line
      x1="12"
      y1="4"
      x2="12"
      y2="17"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    />
    <path
      d="M12 4 C14.5 7 15.2 11 14 15 C13.4 16 12.5 16.5 12 16.5 L12 4 Z"
      fill="currentColor"
      fillOpacity="0.6"
    />
    <path
      d="M12 7 C10 10 9.5 13 10.5 16 C11 16.5 11.5 16.5 12 16.5 L12 7 Z"
      fill="currentColor"
      fillOpacity="0.3"
    />
    <path
      d="M7 17.5 C9.5 19.5 14.5 19.5 17 17.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const Wave: FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 12 C4 9 6 9 8 12 C10 15 12 15 14 12 C16 9 18 9 20 12"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
      opacity="0.5"
    />
    <path
      d="M4 15 C6 12.5 8 12.5 10 15 C12 17.5 14 17.5 16 15"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinecap="round"
      fill="none"
      opacity="0.3"
    />
  </svg>
);

const variants: Record<Variant, FC<{ size: number }>> = {
  sailboat: Sailboat,
  wave: Wave,
};

const BrandMark: FC<Props> = ({ variant = 'sailboat', size = 16, className }) => {
  const Icon = variants[variant];
  return (
    <span className={clsx(styles.mark, className)}>
      <Icon size={size} />
    </span>
  );
};

export default BrandMark;
