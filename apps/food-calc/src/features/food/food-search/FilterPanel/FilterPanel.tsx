import clsx from 'clsx';
import styles from './FilterPanel.module.scss';

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
  isOpen?: boolean;
  header?: React.ReactNode;
  groups: CategoryGroup<T>[];
  options: Record<string, CategoryOption<T>>;
  selectedValues: T[];
  onToggle: (value: T) => void;
  onClear?: () => void;
  title?: string;
  className?: string;
}

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
}: FilterPanelProps<T>) => {
  const hasSelection = selectedValues.length > 0;
  const isSelected = (value: T) => selectedValues.includes(value);

  if (!isOpen) return null;

  return (
    <div className={clsx(styles.panel, className)}>
      <div className={styles.content}>
        {header}
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
