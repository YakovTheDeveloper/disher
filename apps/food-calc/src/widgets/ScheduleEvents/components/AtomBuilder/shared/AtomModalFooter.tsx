/**
 * AtomModalFooter — Bottom panel with Cancel/Add buttons, styled per-atom accent.
 * Same layout as ModalFooter: back (33%) left, primary action (flex:1) right.
 */

import React from 'react';
import styles from './AtomModalFooter.module.css';

export interface AtomModalFooterProps {
  onCancel: () => void;
  onAdd: () => void;
  addDisabled?: boolean;
  addLabel?: string;
  accentColor?: string;
}

export const AtomModalFooter: React.FC<AtomModalFooterProps> = ({
  onCancel,
  onAdd,
  addDisabled = false,
  addLabel = 'Добавить',
  accentColor,
}) => {
  return (
    <div
      className={styles.panel}
      style={accentColor ? ({ '--atom-accent': accentColor } as React.CSSProperties) : undefined}
    >
      <button onClick={onCancel} className={styles.cancelBtn} type="button">
        Отмена
      </button>
      <button onClick={onAdd} disabled={addDisabled} className={styles.addBtn} type="button">
        {addLabel}
      </button>
    </div>
  );
};

AtomModalFooter.displayName = 'AtomModalFooter';
