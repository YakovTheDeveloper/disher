import React from 'react';
import styles from './CommonListItem.module.scss';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { Instance } from 'mobx-state-tree';
import { SyncStatus } from '@/domain/commonListItem';

type Props = {
  children?: React.ReactNode;
  className?: string;
  showAdditionals: boolean;
  id: number | string;
  sync: Instance<typeof SyncStatus>;
  onDelete: (id: string | number) => void;
  // onRecover: (id: string | number) => void;
};
const ListItem = ({
  id,
  children,
  showAdditionals,
  className,
  sync,
  onDelete,
  // onRecover,
}: Props) => {
  const status = sync.status;
  // if (status === 'deleted') return null;

  const onRemoveHandler = () => {
    // if (status === 'deleted') {
    //   onRecover(id);
    //   return;
    // }
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
          showAdditionals && styles.additionalOptions_active
          // status === 'deleted' && styles.additionalOptions_alternative
        )}
      ></button>
    </li>
  );
};

export default observer(ListItem);
