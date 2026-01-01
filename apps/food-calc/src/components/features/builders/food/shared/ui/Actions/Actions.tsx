import { Button } from '@/components/features/builders/food/shared/ui/Actions/button';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import styles from './Actions.module.scss';

type Props = {
  children: React.ReactNode;
  isShow: () => boolean;
  className?: string;
  zIndex?: number;
  isPortal?: boolean; // new prop to toggle portal
};

const Actions = ({ children, isShow, className, zIndex, isPortal = true }: Props) => {
  const style = zIndex ? { zIndex } : {};
  // const show = isShow();
  const show = true;

  const content = (
    <div className={clsx([styles.container, className])} style={style}>
      <AnimatePresence mode="sync">
        {show && (
          <div className={styles.content}>{children}</div>
          // <motion.div
          //   initial={{ opacity: 0, y: 0 }}
          //   animate={{ opacity: 1, y: 0 }}
          //   exit={{ opacity: 0, y: 0 }}
          //   transition={{ duration: 0.3, ease: 'easeOut' }}
          //   className={styles.content}
          // >
          // </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (isPortal) {
    return createPortal(content, document.body);
  }

  return content;
};

export default observer(Actions);
