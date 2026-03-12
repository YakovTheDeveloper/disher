import { FC, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './TextBehind.module.scss';

export interface TextBehindProps {
  text?: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elegant';
}

const TextBehind: FC<TextBehindProps> = ({ text, children, className, variant }) => {
  return (
    <div
      className={clsx(styles.container, variant && styles[variant], className)}
      data-text={text}
    >
      {children}
    </div>
  );
};

export default TextBehind;
