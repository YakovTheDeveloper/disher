import React from 'react';
import styles from './AddButton.module.scss';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

type Props = {
  onClick: VoidFunction;
  children?: string;
  animate?: () => boolean;
};
const AddButton = ({ onClick, animate }: Props) => {
  const shouldAnimate = animate?.();

  console.log('shouldAnimate', shouldAnimate);

  return (
    <button onClick={onClick} className={clsx([styles.container, shouldAnimate && styles.animate])}>
      +
    </button>
  );
};

export default observer(AddButton);
