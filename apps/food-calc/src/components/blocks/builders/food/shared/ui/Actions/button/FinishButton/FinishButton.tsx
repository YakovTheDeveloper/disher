import React from 'react';
import styles from './FinishButton.module.scss';
type Props = {
  onClick: VoidFunction;
  children?: string;
};
const FinishButton = ({ onClick, children }: Props) => {
  return (
    <button onClick={onClick} className={styles.container}>
      {children}
    </button>
  );
};

export default FinishButton;
