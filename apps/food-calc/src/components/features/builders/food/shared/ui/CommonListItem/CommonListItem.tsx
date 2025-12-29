import React, { useState, useEffect, useRef } from 'react';
import styles from './CommonListItem.module.scss';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { Instance } from 'mobx-state-tree';
import { SyncStatus } from '@/domain/commonListItem';
import useOutsideClick from '@/hooks/useOutsideClick';
import { emitter } from '@/infrastructure/emitter/emitter';

type Props = {
  children?: React.ReactNode;
  className?: string;
  showAdditionals: boolean;
  id: number | string;
  sync: Instance<typeof SyncStatus>;
  onDelete: (id: string | number) => void;
  // onRecover: (id: string | number) => void;
};

const LONG_PRESS_DELAY = 400;

const ListItem = ({
  id,
  children,
  className,
  sync,
  onDelete,
  // onRecover,
}: Props) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);

  const [editMode, setEditMode] = useState(false);
  const [tapped, setTapped] = useState(false);

  const onPointerDown = () => {
    longPressTriggered.current = false;
    setTapped(true);

    timerRef.current = setTimeout(() => {
      longPressTriggered.current = true;
      setEditMode(true);
    }, LONG_PRESS_DELAY);
  };

  const onPointerUp = () => {
    setTapped(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    requestAnimationFrame(() => {
      longPressTriggered.current = false;
    });
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (longPressTriggered.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  };

  const status = sync.status;

  const onRemoveHandler = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete(id);
  };

  useEffect(() => {
    const handler = () => {
      setEditMode(false);
    };
    emitter.on('outsideClick', handler);

    return () => {
      emitter.off('outsideClick', handler);
    };
  }, []);

  return (
    <li
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
      className={clsx([
        className,
        styles.container,
        editMode && styles.container_active,
        tapped && styles.container_tapped,
        status && styles[status],
      ])}
    >
      {editMode && <div className={styles.interactionBlocker} aria-hidden />}
      {children}
      {editMode && (
        <button
          onClick={onRemoveHandler}
          className={clsx(styles.deleteButton, editMode && styles.deleteButton_active)}
        >
          Удалить
        </button>
      )}
    </li>
  );
};

export default observer(ListItem);
