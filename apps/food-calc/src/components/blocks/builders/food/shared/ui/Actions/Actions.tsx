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
  return (
    <AnimatePresence>
      {isShow() && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className={styles.actions}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default observer(Actions);
