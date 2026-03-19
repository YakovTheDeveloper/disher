import { FC, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './TextBehind.module.scss';

export type TextBehindPosition =
  | 'top-left'    | 'top-center'    | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface TextBehindProps {
  text?: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elegant';
  position?: TextBehindPosition;
}

const TextBehind: FC<TextBehindProps> = ({ text, children, className, variant, position = 'middle-center' }) => {
  return (
    <div
      className={clsx(
        styles.container,
        styles[`pos-${position}`],
        variant && styles[variant],
        className,
      )}
      data-text={text}
    >
      {children}
    </div>
  );
};

export default TextBehind;
