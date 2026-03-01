/**
 * AtomActionButtons - Cancel and Add buttons for atom inputs
 */

import React from 'react';
import styles from './AtomInputShared.module.css';

export interface AtomActionButtonsProps {
  onCancel: () => void;
  onAdd: () => void;
  addDisabled?: boolean;
  addLabel?: string;
}

export const AtomActionButtons: React.FC<AtomActionButtonsProps> = ({
  onCancel,
  onAdd,
  addDisabled = false,
  addLabel = 'Добавить',
}) => {
  return (
    <div className={styles.actions}>
      <button onClick={onCancel} className={styles.cancelBtn} type="button">
        Отмена
      </button>
      <button onClick={onAdd} disabled={addDisabled} className={styles.addBtn} type="button">
        {addLabel}
      </button>
    </div>
  );
};

AtomActionButtons.displayName = 'AtomActionButtons';
