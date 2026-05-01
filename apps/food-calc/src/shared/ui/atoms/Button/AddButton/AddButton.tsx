import styles from './AddButton.module.scss';
import clsx from 'clsx';
import PlusIcon from '@/shared/assets/icons/rounded-plus-icon.svg';
import React from 'react';
import { toast } from 'sonner';

type Props = {
  onClick: VoidFunction;
  children?: React.ReactNode;
  animate?: () => boolean;
  as?: 'button' | 'label';
  htmlFor?: string;
  prominent?: boolean;
};
const AddButton = ({ onClick, children, as = 'button', htmlFor, prominent }: Props) => {
  const Tag = as;
  const handleClick = () => {
    toast.dismiss();
    onClick();
  };
  return (
    <Tag
      onClick={handleClick}
      htmlFor={htmlFor}
      className={clsx(styles.container, children && styles.withText, prominent && styles.prominent)}
    >
      <span className={styles.icon}>
        <PlusIcon />
      </span>
      {children && <span className={styles.text}>{children}</span>}
    </Tag>
  );
};

export default AddButton;
