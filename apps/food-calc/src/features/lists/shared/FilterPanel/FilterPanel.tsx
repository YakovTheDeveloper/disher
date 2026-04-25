import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import Button from '@/shared/ui/atoms/Button/Button';
import styles from './FilterPanel.module.scss';

interface FilterItem {
  value: string;
  label: string;
}

interface FilterColumn {
  items: FilterItem[];
}

interface FilterPanelProps {
  columns: FilterColumn[];
  selectedFilters: string[];
  onFilterChange: (filterValue: string) => void;
}

const FilterPanel = ({ columns, selectedFilters, onFilterChange }: FilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleFilterClick = useCallback(
    (filterValue: string) => {
      onFilterChange(filterValue);
    },
    [onFilterChange]
  );

  return (
    <div className={styles.container}>
      <div className={styles.buttonWrapper}>
        <Button
          variant="filter"
          className={clsx(styles.toggleButton, isOpen && styles.toggleButtonActive)}
          onClick={handleToggle}
        >
          {isOpen ? '✕' : 'Фильтр'}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{
              duration: 0.2,
              ease: [0.25, 0.8, 0.25, 1],
            }}
          >
            {columns.map((column, colIndex) => (
              <div key={colIndex} className={styles.column}>
                {column.items.map((filter) => {
                  const isActive = selectedFilters.includes(filter.value);
                  return (
                    <Button
                      key={filter.value}
                      variant="filter"
                      className={clsx(styles.filterButton, isActive && styles.filterButtonActive)}
                      onClick={() => handleFilterClick(filter.value)}
                    >
                      {filter.label}
                    </Button>
                  );
                })}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterPanel;
