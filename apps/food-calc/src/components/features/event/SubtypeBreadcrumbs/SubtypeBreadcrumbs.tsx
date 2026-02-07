import React from 'react';
import { motion } from 'framer-motion';
import { StackItem } from '../types';
import styles from './SubtypeBreadcrumbs.module.scss';
import { useTranslation } from 'react-i18next';

export interface SubtypeBreadcrumbsProps {
  items: StackItem[];
  onItemClick: (index: number) => void;
  onRemove: (index: number, e: React.MouseEvent) => void;
  removeTitle?: string;
}

/**
 * Компонент отображения выбранной цепочки категорий
 * Показывает вертикальный стек с визуальной иерархией
 */
export const SubtypeBreadcrumbs: React.FC<SubtypeBreadcrumbsProps> = ({
  items,
  onItemClick,
  onRemove,
  removeTitle,
}) => {
  if (items.length === 0) return null;

  const { t } = useTranslation();

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {items.map((item, index) => (
        <motion.button
          key={item.value}
          type="button"
          className={styles.item}
          style={{ '--depth': item.depth } as React.CSSProperties}
          onClick={() => onItemClick(index)}
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05, duration: 0.2 }}
        >
          <span className={styles.label}>{item.label}</span>
          <span className={styles.remove} onClick={(e) => onRemove(index, e)} title={removeTitle}>
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L5 5M5 5L9 9M5 5L9 1M5 5L1 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
};
