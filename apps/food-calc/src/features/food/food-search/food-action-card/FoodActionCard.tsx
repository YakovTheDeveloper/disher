import { useMemo } from 'react';
import clsx from 'clsx';
import styles from './FoodActionCard.module.scss';
import { deleteProducts } from '@/entities/product';
import { deleteDishes } from '@/entities/dish';
import { PopoverTrigger } from '@/shared/ui/popover/PopoverTrigger';
import { isCreatedByUser } from '@/shared/lib';
import { getCategoryIcon } from './categoryIcons';

type Props = {
  variant: 'product' | 'dish';
  item: {
    id: string;
    name: string;
    userId?: string;
    categories?: Set<string> | null;
    getTotalNutrients?: (qty: number) => Record<string, number>;
  };
  active?: boolean;
  onClick?: () => void;
  onAdd?: () => void;
  showDelete?: boolean;
  showAdd?: boolean;
  rightChild?: React.ReactNode;
  richNutrientId?: string | null;
  richNutrientUnit?: string;
  richNutrientMax?: number;
};

const RICHNESS_COLORS = [
  '#bbb', // 0: none
  '#999', // very low
  '#e8a838', // low-mid warm
  '#e07b28', // mid amber
  '#d45d1e', // high amber
  '#b83d15', // deep
  '#1a8c4e', // rich green
  '#0f7a3f', // deep green
] as const;

function getRichnessColor(ratio: number): string {
  if (ratio <= 0) return RICHNESS_COLORS[0];
  const idx = Math.min(
    Math.floor(ratio * (RICHNESS_COLORS.length - 1)),
    RICHNESS_COLORS.length - 1
  );
  return RICHNESS_COLORS[idx];
}

function getMassPercent(value: number, unit: string): string {
  if (unit === 'г' || unit === 'g') return `${value.toFixed(1)}%`;
  if (unit === 'мг' || unit === 'mg') return `${(value / 1000).toFixed(3)}%`;
  if (unit === 'мкг' || unit === 'μg' || unit === 'mcg')
    return `${(value / 1_000_000).toFixed(6)}%`;
  return '';
}

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const FoodActionCard = ({
  variant,
  item,
  active,
  onClick,
  showDelete = false,
  rightChild,
  richNutrientId,
  richNutrientUnit,
  richNutrientMax = 0,
}: Props) => {
  const userCreated = variant === 'dish' ? true : isCreatedByUser(item.userId);
  const categoryIcon = getCategoryIcon(item.categories);

  const handleDelete = () => {
    if (variant === 'product') {
      deleteProducts([item.id]);
    } else {
      deleteDishes([item.id]);
    }
  };

  const deleteButton = showDelete ? (
    userCreated ? (
      <PopoverTrigger
        placement="bottom-start"
        trigger={
          <button
            className={clsx(styles.iconBtn, styles.deleteBtn)}
            type="button"
            aria-label="Удалить"
          >
            <TrashIcon />
          </button>
        }
        content={
          <div className={styles.popoverContent}>
            <button className={styles.popoverAction} type="button" onClick={handleDelete}>
              Удалить {variant === 'product' ? 'продукт' : 'блюдо'}
            </button>
          </div>
        }
      />
    ) : (
      <div className={styles.iconBtn} />
    )
  ) : null;

  const richNutrientValue =
    richNutrientId && item.getTotalNutrients
      ? (item.getTotalNutrients(100)[richNutrientId] ?? 0)
      : null;

  const richness = useMemo(() => {
    if (richNutrientValue === null || richNutrientMax <= 0) return 0;
    return Math.min(richNutrientValue / richNutrientMax, 1);
  }, [richNutrientValue, richNutrientMax]);

  const richnessColor = richNutrientValue !== null ? getRichnessColor(richness) : undefined;
  const massPercent =
    richNutrientValue !== null && richNutrientValue > 0 && richNutrientUnit
      ? getMassPercent(richNutrientValue, richNutrientUnit)
      : null;

  return (
    <li className={styles.wrapper}>
      {richNutrientValue !== null && richness > 0 && (
        <span
          className={styles.richBar}
          style={{ width: `${richness * 70}%`, backgroundColor: richnessColor }}
        />
      )}
      {richNutrientValue !== null && (
        <span
          className={styles.richValue}
          style={richnessColor ? { color: richnessColor } : undefined}
        >
          {richNutrientValue > 0 ? richNutrientValue.toFixed(1) : '—'}
          {richNutrientValue > 0 && richNutrientUnit && (
            <span className={styles.richUnit}>{richNutrientUnit}</span>
          )}
          {massPercent && <span className={styles.richPercent}>{massPercent}</span>}
        </span>
      )}
      {deleteButton}
      <p
        className={clsx(styles.item, active && styles.item_active)}
        onClick={() => {
          onClick?.();
        }}
      >
        {categoryIcon && (
          <img src={categoryIcon} alt="" className={styles.categoryIcon} aria-hidden="true" />
        )}
        <span className={styles.name}>{item.name}</span>
      </p>
      {rightChild}
    </li>
  );
};

export default FoodActionCard;
