import React from 'react';
import { createPortal } from 'react-dom';
import styles from './ModalByLabel.module.scss';
import clsx from 'clsx';

export interface ModalByLabelProps {
  content: React.ReactNode;
  isExpanded: boolean;
  position?: 'fixed' | 'absolute';
  className?: string;
  /**
   * Portal target. Defaults to `#modal-by-label-root` (top-level, behind real
   * modals). Pass a node INSIDE a host modal's popup so this overlay joins that
   * popup's stacking context — then a real modal opened on top (e.g. the delete
   * ConfirmModal) still paints above it. React event bubbling is unaffected by
   * the DOM target (the portal stays a React-child of wherever <ModalByLabel> is
   * placed), so label-focus delegation keeps working.
   */
  container?: HTMLElement | null;
}

const ModalByLabel: React.FC<ModalByLabelProps> = ({
  content,
  isExpanded,
  position = 'fixed',
  className,
  container,
}) => {
  const node = (
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
      <div className={clsx(styles.content, !isExpanded && styles.collapsed)}>{content}</div>
    </div>
  );

  const target =
    container ?? document.getElementById('modal-by-label-root') ?? document.body;
  return createPortal(node, target);
};

export default ModalByLabel;
