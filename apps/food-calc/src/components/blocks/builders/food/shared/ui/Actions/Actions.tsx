import { Button } from '@/components/blocks/builders/food/shared/ui/Actions/button';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Actions.module.scss';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

type Props = {
  children: React.ReactNode;
  isShow: () => boolean;
  className?: string;
  zIndex?: number;
};

const Actions = ({ children, isShow, className, zIndex }: Props) => {
  const style = zIndex ? { zIndex } : {};

  const show = isShow();
  return createPortal(
    <div className={clsx([styles.container, className])} style={style}>
      <AnimatePresence mode="sync">
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -200 }}
            exit={{ opacity: 0, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={styles.content}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default observer(Actions);
