import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import styles from './FoodActionCard.module.scss';
import { domainStore } from '@/store/store';
import { PopoverTrigger } from '@/components/ui/popover/PopoverTrigger';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { drawerStoreV3 } from '@/store/GlobalUiStore/DrawerStoreV3/DrawerStoreV3';
import { FoodActionsDrawer } from '@/components/widgets/food/food-actions-drawer';

type Props = {
  variant: 'product' | 'dish';
  item: { id: string; name: string; createdByUser?: boolean; getTotalNutrients?: (qty: number) => Record<string, number> };
  active?: boolean;
  onClick?: () => void;
  onAdd?: () => void;
  showDelete?: boolean;
  showAdd?: boolean;
  showInfo?: boolean;
  showMore?: boolean;
  richNutrientId?: string | null;
  richNutrientUnit?: string;
  richNutrientMax?: number;
};

const RICHNESS_COLORS = [
  '#bbb',     // 0: none
  '#999',     // very low
  '#e8a838',  // low-mid warm
  '#e07b28',  // mid amber
  '#d45d1e',  // high amber
  '#b83d15',  // deep
  '#1a8c4e',  // rich green
  '#0f7a3f',  // deep green
] as const;

function getRichnessColor(ratio: number): string {
  if (ratio <= 0) return RICHNESS_COLORS[0];
  const idx = Math.min(Math.floor(ratio * (RICHNESS_COLORS.length - 1)), RICHNESS_COLORS.length - 1);
  return RICHNESS_COLORS[idx];
}

function getMassPercent(value: number, unit: string): string {
  if (unit === 'г' || unit === 'g') return `${value.toFixed(1)}%`;
  if (unit === 'мг' || unit === 'mg') return `${(value / 1000).toFixed(3)}%`;
  if (unit === 'мкг' || unit === 'μg' || unit === 'mcg') return `${(value / 1_000_000).toFixed(6)}%`;
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

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.2" />
    <text
      x="10.5"
      y="15"
      textAnchor="middle"
      fontStyle="italic"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="13"
      fill="currentColor"
    >
      i
    </text>
  </svg>
);

const AddIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="4" fill="#9CA3AF" />
    <path d="M12 7V17M7 12H17" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="5" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="19" r="1.5" fill="currentColor" />
  </svg>
);

const FoodActionCard = ({
  variant,
  item,
  active,
  onClick,
  onAdd,
  showDelete = false,
  showAdd = false,
  showInfo = false,
  showMore = false,
  richNutrientId,
  richNutrientUnit,
  richNutrientMax = 0,
}: Props) => {
  const { toProduct, toDish } = useAppRoutes();
  const isUserCreated = variant === 'dish' ? true : !!item.createdByUser;

  const handleInfo = () => {
    if (variant === 'product') toProduct(item.id.toString());
    else toDish(item.id.toString());
  };

  const handleDelete = () => {
    if (variant === 'product') {
      domainStore.foodStore.removeBulk([item.id]);
    } else {
      domainStore.dishStore.removeBulk([item.id]);
    }
  };

  const deleteButton = showDelete ? (
    isUserCreated ? (
      <PopoverTrigger
        placement="bottom-start"
        trigger={
          <button className={clsx(styles.iconBtn, styles.deleteBtn)} type="button" aria-label="Удалить">
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

  const richNutrientValue = richNutrientId && item.getTotalNutrients
    ? item.getTotalNutrients(100)[richNutrientId] ?? 0
    : null;

  const richness = useMemo(() => {
    if (richNutrientValue === null || richNutrientMax <= 0) return 0;
    return Math.min(richNutrientValue / richNutrientMax, 1);
  }, [richNutrientValue, richNutrientMax]);

  const richnessColor = richNutrientValue !== null ? getRichnessColor(richness) : undefined;
  const massPercent = richNutrientValue !== null && richNutrientValue > 0 && richNutrientUnit
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
        <span className={styles.richValue} style={richnessColor ? { color: richnessColor } : undefined}>
          {richNutrientValue > 0 ? richNutrientValue.toFixed(1) : '—'}
          {richNutrientValue > 0 && richNutrientUnit && (
            <span className={styles.richUnit}>{richNutrientUnit}</span>
          )}
          {massPercent && (
            <span className={styles.richPercent}>{massPercent}</span>
          )}
        </span>
      )}
      {deleteButton}
      <p
        className={clsx(styles.item, active && styles.item_active)}
        onClick={onClick}
      >
        <span className={styles.name}>{item.name}</span>
      </p>
      {showInfo && (
        <button className={styles.iconBtn} type="button" aria-label="Информация" onClick={(e) => { e.stopPropagation(); handleInfo(); }}>
          <InfoIcon />
        </button>
      )}
      {showAdd && onAdd && (
        <button className={styles.iconBtn} type="button" aria-label="Добавить" onClick={(e) => { e.stopPropagation(); onAdd(); }}>
          <AddIcon />
        </button>
      )}
      {showMore && (
        <button
          className={styles.iconBtn}
          type="button"
          aria-label="Ещё"
          onClick={(e) => {
            e.stopPropagation();
            drawerStoreV3.show(FoodActionsDrawer, {
              variant,
              itemId: item.id,
              itemName: item.name,
              isUserCreated,
            });
          }}
        >
          <MoreIcon />
        </button>
      )}
    </li>
  );
};

export default observer(FoodActionCard);
