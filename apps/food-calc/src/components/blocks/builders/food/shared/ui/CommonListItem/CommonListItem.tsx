import React from 'react';
import styles from './CommonListItem.module.scss';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';

type Props = {
  children?: React.ReactNode;
  className?: string;
  status: 'added' | 'deleted' | 'modified' | 'none' | null;
  showAdditionals: boolean;
  id: number | string;
  onDelete: (id: string | number) => void;
  onRecover: (id: string | number) => void;
};
const ListItem = ({
  id,
  children,
  showAdditionals,
  className,
  status,
  onDelete,
  onRecover,
}: Props) => {
  const onRemoveHandler = () => {
    if (status === 'deleted') {
      onRecover(id);
      return;
    }
    onDelete(id);
  };

  console.log('from common list item');

  return (
    <li
      className={clsx([
        className,
        styles.container,
        showAdditionals && styles.container_active,
        status && styles[status],
      ])}
    >
      {children}
      <button
        onClick={onRemoveHandler}
        className={clsx(
          styles.additionalOptions,
          showAdditionals && styles.additionalOptions_active,
          status === 'deleted' && styles.additionalOptions_alternative
        )}
      ></button>
    </li>
  );
};

export default observer(ListItem);
