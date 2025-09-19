import { Button } from '@/components/blocks/builders/food/shared/ui/Actions/button';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Actions.module.scss';

type Props = {
  children: React.ReactNode;
  isShow: () => boolean;
};

const Actions = ({ children, isShow }: Props) => {
  const show = isShow();

  return (
    <div className={styles.container}>
      <AnimatePresence mode="sync">
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -100 }}
            exit={{ opacity: 0, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={styles.content}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default observer(Actions);
