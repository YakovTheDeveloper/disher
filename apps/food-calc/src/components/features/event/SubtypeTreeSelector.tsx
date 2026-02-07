import React from 'react';
import { AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { EventSubtype } from '@/domain/schedule/scheduleEvent/eventTypes';
import { useTranslation } from 'react-i18next';
import { useSubtypeTree } from './useSubtypeTree';
import { SubtypeBreadcrumbs } from './SubtypeBreadcrumbs';
import { SubtypeOptions } from './SubtypeOptions';
import { SubtypePlaceholder } from './SubtypePlaceholder';
import { SubtypeOption } from './types';
import styles from './SubtypeTreeSelector.module.scss';

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

  const {
    currentLevel,
    isMaxDepthReached,
    currentOptions,
    currentValue,
    stackItems,
    selectValue,
    navigateToStackIndex,
    removeFromStack,
  } = useSubtypeTree({
    options,
    selectedChain,
    maxDepth,
    onChange,
  });

  const handleRemoveFromStack = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromStack(index);
  };

  const hasOptions = currentOptions.length > 0;

  return (
    <div className={clsx(styles.container, className)}>
      {/* Стек выбранных категорий (breadcrumbs) */}
      <AnimatePresence>
        {stackItems.length > 0 && (
          <SubtypeBreadcrumbs
            items={stackItems}
            onItemClick={navigateToStackIndex}
            onRemove={handleRemoveFromStack}
            removeTitle={t('common.remove')}
          />
        )}
      </AnimatePresence>

      {/* Текущий уровень выбора */}
      <AnimatePresence mode="wait">
        {isMaxDepthReached ? (
          <SubtypePlaceholder
            key="maxDepth"
            type="maxDepth"
            message={t('subtype.lastTypeSelected')}
          />
        ) : !hasOptions ? (
          <SubtypePlaceholder
            key="complete"
            type="complete"
            message={t('subtype.selectionComplete')}
          />
        ) : (
          <SubtypeOptions
            key={`level-${currentLevel}`}
            options={currentOptions}
            selectedValue={currentValue}
            onSelect={selectValue}
            getLabel={(key: string) => t(key)}
          />
        )}
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

export type { SubtypeOption } from './types';
export { useSubtypeTree } from './useSubtypeTree';
