import { FC, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './TextBehind.module.scss';

export interface TextBehindProps {
  text?: string;
  children: ReactNode;
  className?: string;
}

const TextBehind: FC<TextBehindProps> = ({ text, children, className }) => {
  return (
    <div className={clsx(styles.container, className)} data-text={text}>
      {children}
    </div>
  );
};

export default TextBehind;
