import React from 'react';
import styles from './ModalByLabel.module.scss';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

export interface ModalByLabelProps {
  content: React.ReactNode;
  isExpanded: boolean;
  position?: 'fixed' | 'absolute';
  className?: string;
}

const ModalByLabel: React.FC<ModalByLabelProps> = observer(
  ({ content, isExpanded, position = 'fixed', className }) => {
    return (
      <div
        data-modal-by-label={isExpanded ? 'expanded' : 'collapsed'}
        className={clsx(
          styles.container,
          position === 'fixed' && isExpanded && styles.fixed,
          position === 'absolute' && isExpanded && styles.absolute,
          isExpanded && styles.expanded,
          className
        )}
      >
        {<div className={clsx(styles.content, !isExpanded && styles.collapsed)}>{content}</div>}
      </div>
    );
  }
);

export default ModalByLabel;
