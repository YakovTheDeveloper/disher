import React from 'react';
import styles from './AddButton.module.scss';

type Props = {
  onClick: VoidFunction;
  children?: string;
};
const AddButton = ({ onClick }: Props) => {
  return (
    <button onClick={onClick} className={styles.container}>
      +
    </button>
  );
};

export default AddButton;
