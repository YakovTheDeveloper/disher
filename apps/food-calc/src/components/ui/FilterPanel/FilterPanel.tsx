import { FC, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import styles from './FilterPanel.module.scss';

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface FilterPanelProps {
  isOpen: boolean;
  primaryOptions: FilterOption[];
  selectedPrimary: string | null;
  onPrimaryChange: (value: string) => void;
  secondaryOptions?: FilterOption[];
  selectedSecondary: string[];
  onSecondaryChange: (value: string) => void;
  className?: string;
  maxHeight?: string | number;
  onClose?: () => void;
}

const FilterPanel: FC<FilterPanelProps> = ({
  isOpen,
  primaryOptions,
  selectedPrimary,
  onPrimaryChange,
  secondaryOptions = [],
  selectedSecondary,
  onSecondaryChange,
  className,
  maxHeight = 280,
  onClose,
}) => {
  const handlePrimaryClick = useCallback(
    (value: string) => {
      onPrimaryChange(value);
      // onClose?.();
    },
    [onPrimaryChange, onClose]
  );

  const handleSecondaryClick = useCallback(
    (value: string) => {
      onSecondaryChange(value);
    },
    [onSecondaryChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={clsx(styles.panel, className)}
          style={{ maxHeight }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.8, 0.25, 1],
          }}
        >
          <div className={styles.content}>
            {/* Primary Filters Section */}
            {primaryOptions.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Тип</h3>
                <div className={styles.primaryContainer}>
                  {primaryOptions.map((option) => (
                    <button
                      key={option.value}
                      className={clsx(
                        styles.primaryButton,
                        selectedPrimary === option.value && styles.primaryButtonActive
                      )}
                      onClick={() => handlePrimaryClick(option.value)}
                      onKeyDown={(e) => handleKeyDown(e, () => handlePrimaryClick(option.value))}
                      aria-pressed={selectedPrimary === option.value}
                      aria-label={option.label}
                    >
                      {option.icon && <span className={styles.icon}>{option.icon}</span>}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Secondary Filters Section */}
            {secondaryOptions.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Фильтры</h3>
                <div className={styles.secondaryContainer}>
                  {secondaryOptions.map((option) => (
                    <button
                      key={option.value}
                      className={clsx(
                        styles.tag,
                        selectedSecondary.includes(option.value) && styles.tagActive
                      )}
                      onClick={() => handleSecondaryClick(option.value)}
                      onKeyDown={(e) => handleKeyDown(e, () => handleSecondaryClick(option.value))}
                      aria-pressed={selectedSecondary.includes(option.value)}
                      aria-label={option.label}
                    >
                      {option.icon && <span className={styles.icon}>{option.icon}</span>}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Animated border gradient at bottom */}
          <div className={styles.borderGradient} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilterPanel;
