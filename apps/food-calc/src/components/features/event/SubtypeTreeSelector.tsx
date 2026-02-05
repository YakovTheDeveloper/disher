import React from 'react';
import { EventSubtype } from '@/domain/schedule/scheduleEvent/eventTypes';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SubtypeTreeSelector.module.scss';

/**
 * Конфигурация подтипа с возможными дочерними элементами
 */
export interface SubtypeOption {
  value: EventSubtype;
  labelKey: string;
  children?: SubtypeOption[];
}

/**
 * Props для SubtypeTreeSelector
 */
interface Props {
  /** Доступные подтипы для текущего уровня */
  options: SubtypeOption[];
  /** Текущая выбранная цепочка подтипов */
  selectedChain: EventSubtype[];
  /** Максимальная глубина вложенности */
  maxDepth?: number;
  /** Колбэк при изменении выбора */
  onChange: (newChain: EventSubtype[]) => void;
  /** Дополнительные CSS классы */
  className?: string;
}

/**
 * Вспомогательная функция для получения опции по цепочке значений
 */
function getOptionByChain(
  options: SubtypeOption[],
  chain: EventSubtype[]
): SubtypeOption | undefined {
  if (chain.length === 0) return undefined;
  const currentValue = chain[0];
  const currentOption = options.find((opt) => opt.value === currentValue);
  if (!currentOption) return undefined;
  if (chain.length === 1) return currentOption;
  return getOptionByChain(currentOption.children || [], chain.slice(1));
}

/**
 * Рекурсивный селектор подтипов с прогрессивным раскрытием
 * Показывает стек выбранных категорий и новые уровни снизу
 */
export const SubtypeTreeSelector: React.FC<Props> = ({
  options,
  selectedChain,
  maxDepth = 3,
  onChange,
  className,
}) => {
  const { t } = useTranslation();
  const currentLevel = selectedChain.length;

  // Не рендерим, если достигли максимальной глубины
  if (currentLevel >= maxDepth) return null;

  // Получаем опции для текущего уровня
  const currentOptions =
    currentLevel === 0
      ? options
      : getOptionByChain(options, selectedChain.slice(0, currentLevel))?.children || [];

  const currentValue = selectedChain[currentLevel] || null;

  // Получаем метки для стека (только если мы не на первом уровне)
  const stackLabels = selectedChain.slice(0, currentLevel).map((value, index) => {
    const chainPart = selectedChain.slice(0, index + 1);
    const option = getOptionByChain(options, chainPart);
    return {
      value,
      label: option ? t(option.labelKey) : value,
    };
  });

  const handleSelect = (value: EventSubtype) => {
    const newChain = selectedChain.slice(0, currentLevel).concat(value);
    onChange(newChain);
  };

  const handleStackClick = (index: number) => {
    const newChain = selectedChain.slice(0, index + 1);
    onChange(newChain);
  };

  const handleRemoveFromStack = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newChain = selectedChain.slice(0, index);
    onChange(newChain);
  };

  return (
    <div className={clsx(styles.container, className)}>
      {/* Стек выбранных категорий (breadcrumbs) */}
      <AnimatePresence>
        {stackLabels.length > 0 && (
          <motion.div
            className={styles.stack}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {stackLabels.map((item, index) => (
              <React.Fragment key={item.value}>
                {index > 0 && <span className={styles.stackSeparator}>/</span>}
                <button
                  type="button"
                  className={styles.stackItem}
                  onClick={() => handleStackClick(index)}
                >
                  {item.label}
                  <span
                    className={styles.stackRemove}
                    onClick={(e) => handleRemoveFromStack(index, e)}
                  >
                    ×
                  </span>
                </button>
              </React.Fragment>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Текущий уровень выбора */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLevel}
          className={styles.optionsWrapper}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {currentOptions.length === 0 ? (
            <div className={styles.placeholder}>{t('subtype.selectCategory')}</div>
          ) : (
            <div className={styles.optionsGrid}>
              {currentOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={clsx(styles.option, currentValue === option.value && styles.selected)}
                  onClick={() => handleSelect(option.value)}
                >
                  <span className={styles.label}>{t(option.labelKey)}</span>
                  {option.children && <span className={styles.indicator}>→</span>}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Следующий уровень (рекурсивно) */}
      {currentValue && currentLevel < maxDepth - 1 && (
        <SubtypeTreeSelector
          options={options}
          selectedChain={selectedChain}
          maxDepth={maxDepth}
          onChange={onChange}
        />
      )}
    </div>
  );
};
