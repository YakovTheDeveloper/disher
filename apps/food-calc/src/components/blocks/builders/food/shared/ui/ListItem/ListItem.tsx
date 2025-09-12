import React from 'react';
import styles from './ListItem.module.scss';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';

type Props = {
  children?: React.ReactNode;
  className?: string;
  options: {
    showAdditionals: boolean;
  };
};
const ListItem = ({ children, options, className }: Props) => {
  const showMore = options.showAdditionals;

  return (
    <li className={clsx([styles.container, showMore && styles.container_active, className])}>
      <div className={styles.group}>{children}</div>
      <button
        className={clsx(styles.additionalOptions, showMore && styles.additionalOptions_active)}
      >
        x
      </button>
    </li>
  );
};

export default observer(ListItem);
