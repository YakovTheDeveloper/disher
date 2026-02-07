import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { SubtypeOption } from '../types';
import { EventSubtype } from '@/domain/schedule/scheduleEvent/eventTypes';
import styles from './SubtypeOptions.module.scss';

export interface SubtypeOptionsProps {
  options: SubtypeOption[];
  selectedValue: EventSubtype | null;
  onSelect: (value: EventSubtype) => void;
  getLabel: (labelKey: string) => string;
}

/**
 * Компонент сетки опций для выбора
 * Отображает карточки с возможностью выбора
 */
export const SubtypeOptions: React.FC<SubtypeOptionsProps> = ({
  options,
  selectedValue,
  onSelect,
  getLabel,
}) => {
  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.grid}>
        {options.map((option, index) => {
          const hasChildren = Boolean(option.children && option.children.length > 0);
          const isSelected = selectedValue === option.value;

          return (
            <motion.button
              key={option.value}
              type="button"
              className={clsx(styles.option, isSelected && styles.selected)}
              onClick={() => onSelect(option.value)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className={styles.label}>{getLabel(option.labelKey)}</span>
              {hasChildren && (
                <span className={styles.indicator}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 3L9 7L5 11"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
