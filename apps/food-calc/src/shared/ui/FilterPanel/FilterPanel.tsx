import clsx from 'clsx';
import { useRef } from 'react';
import styles from './FilterPanel.module.scss';

// Generic types for category values
export type CategoryValue = string;

export interface CategoryGroup<T extends string = string> {
  groupName: string;
  categories: T[];
  icon?: string;
}

export interface CategoryOption<T extends string = string> {
  value: T;
  label: string;
  popularity?: number;
}

export interface FilterPanelProps<T extends string = string> {
  /** Whether the panel is open/visible */
  isOpen?: boolean;
  header?: React.ReactNode;
  /** Array of category groups to display */
  groups: CategoryGroup<T>[];
  /** Map of category values to their display options */
  options: Record<string, CategoryOption<T>>;
  /** Currently selected category values */
  selectedValues: T[];
  /** Callback when a category is toggled */
  onToggle: (value: T) => void;
  /** Callback to clear all selections */
  onClear?: () => void;
  /** Optional title for the panel */
  title?: string;
  /** Optional className for styling overrides */
  className?: string;
  /** Optional test id for testing */
  testId?: string;
}

/**
 * A dumb (presentational) filter panel component for mobile-first design.
 * Works with any entity that has categorized values (Product, Dish, etc.)
 *
 * @example
 * <FilterPanel
 *   groups={DISH_CATEGORY_GROUPS}
 *   options={dishOptions}
 *   selectedValues={selectedCategories}
 *   onToggle={handleToggle}
 *   onClear={handleClear}
 *   title="Filter by Category"
 * />
 */
const FilterPanel = <T extends CategoryValue>({
  isOpen = true,
  groups,
  header,
  options,
  selectedValues,
  onToggle,
  onClear,
  title,
  className,
  testId,
}: FilterPanelProps<T>) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const hasSelection = selectedValues.length > 0;

  const isSelected = (value: T): boolean => selectedValues.includes(value);

  if (!isOpen) return null;

  return (
    <div
      className={clsx(styles.panel, className)}
      data-testid={testId}
    >
      <div className={styles.content} ref={contentRef}>
        {header}
        {/* Header with title and clear button */}
        {(title || hasSelection) && (
          <div className={styles.header}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {hasSelection && onClear && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={onClear}
                aria-label="Сбросить все фильтры"
              >
                Сбросить
              </button>
            )}
          </div>
        )}

        {/* Category groups */}
        <div className={styles.groups}>
          {groups.map((group) => (
            <section key={group.groupName} className={styles.section}>
              <h4 className={styles.sectionTitle}>{group.groupName}</h4>
              <div className={styles.tagsContainer}>
                {group.categories.map((categoryValue) => {
                  const option = options[categoryValue];
                  if (!option) return null;

                  const selected = isSelected(categoryValue);

                  return (
                    <button
                      key={categoryValue}
                      type="button"
                      className={clsx(styles.tag, selected && styles.tagActive)}
                      onClick={() => onToggle(categoryValue)}
                      aria-pressed={selected}
                    >
                      {group.icon && (
                        <span className={styles.tagIcon} aria-hidden="true">
                          {group.icon}
                        </span>
                      )}
                      <span className={styles.tagLabel}>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>


      </div>
    </div>
  );
};

export default FilterPanel;
