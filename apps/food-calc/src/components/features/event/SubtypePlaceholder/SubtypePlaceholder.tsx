import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import styles from './SubtypePlaceholder.module.scss';

export interface SubtypePlaceholderProps {
  type: 'maxDepth' | 'complete';
  message: string;
}

const icons = {
  maxDepth: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M16 24H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 16V32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  complete: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16 24L21 29L32 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/**
 * Компонент placeholder для состояний:
 * - достигнута максимальная глубина
 * - выбор завершён (нет дочерних элементов)
 */
export const SubtypePlaceholder: React.FC<SubtypePlaceholderProps> = ({ type, message }) => {
  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className={clsx(styles.icon, styles[type])}>{icons[type]}</div>
      <p className={styles.message}>{message}</p>
    </motion.div>
  );
};
