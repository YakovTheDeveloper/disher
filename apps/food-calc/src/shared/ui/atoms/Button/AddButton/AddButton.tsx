import styles from './AddButton.module.scss';
import clsx from 'clsx';
import React from 'react';
import { toast } from 'sonner';

const PlusIcon = () => (
  <svg
    width="50"
    height="50"
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <mask id="path-1-inside-1_31_498" fill="white">
      <path d="M25 0C29.4183 1.93129e-07 33 3.58172 33 8V17H42C46.4183 17 50 20.5817 50 25C50 29.4183 46.4183 33 42 33H33V42C33 46.4183 29.4183 50 25 50C20.5817 50 17 46.4183 17 42V33H8C3.58172 33 0 29.4183 0 25C0 20.5817 3.58172 17 8 17H17V8C17 3.58172 20.5817 -1.93129e-07 25 0Z" />
    </mask>
    <path
      d="M25 0V-3V0ZM33 8H36V8L33 8ZM33 17H30V20H33V17ZM33 33V30H30V33H33ZM33 42H36V42H33ZM25 50V53V53V50ZM17 42H20V42H17ZM17 33H20V30H17V33ZM8 17V14H8L8 17ZM17 17V20H20V17H17ZM17 8H14V8H17ZM25 0V3C27.7614 3 30 5.23858 30 8H33L36 8C36 1.92487 31.0751 -3 25 -3V0ZM33 8H30V17H33H36V8H33ZM33 17V20H42V17V14H33V17ZM42 17V20C44.7614 20 47 22.2386 47 25H50H53C53 18.9249 48.0751 14 42 14V17ZM50 25H47C47 27.7614 44.7614 30 42 30V33V36C48.0751 36 53 31.0751 53 25H50ZM42 33V30H33V33V36H42V33ZM33 33H30V42H33H36V33H33ZM33 42H30C30 44.7614 27.7614 47 25 47V50V53C31.0751 53 36 48.0751 36 42H33ZM25 50V47C22.2386 47 20 44.7614 20 42H17H14C14 48.0751 18.9249 53 25 53V50ZM17 42H20V33H17H14V42H17ZM17 33V30H8V33V36H17V33ZM8 33V30C5.23858 30 3 27.7614 3 25H0H-3C-3 31.0751 1.92487 36 8 36V33ZM0 25H3C3 22.2386 5.23858 20 8 20V17L8 14C1.92487 14 -3 18.9249 -3 25H0ZM8 17V20H17V17V14H8V17ZM17 17H20V8H17H14V17H17ZM17 8H20C20 5.23858 22.2386 3 25 3V0V-3C18.9249 -3 14 1.92487 14 8H17Z"
      fill="currentColor"
      mask="url(#path-1-inside-1_31_498)"
    />
  </svg>
);

type Props = {
  onClick: VoidFunction;
  children?: React.ReactNode;
  animate?: () => boolean;
  as?: 'button' | 'label';
  htmlFor?: string;
  prominent?: boolean;
  dark?: boolean;
  inverse?: boolean;
};
const AddButton = ({
  onClick,
  children,
  as = 'button',
  htmlFor,
  prominent,
  dark,
  inverse,
}: Props) => {
  const Tag = as;
  const handleClick = () => {
    toast.dismiss();
    onClick();
  };
  return (
    <Tag
      onClick={handleClick}
      htmlFor={htmlFor}
      className={clsx(
        styles.container,
        children && styles.withText,
        prominent && styles.prominent,
        dark && styles.dark,
        inverse && styles.inverse
      )}
    >
      <span className={styles.icon}>
        <PlusIcon />
      </span>
      {children && <span className={styles.text}>{children}</span>}
    </Tag>
  );
};

export default AddButton;
