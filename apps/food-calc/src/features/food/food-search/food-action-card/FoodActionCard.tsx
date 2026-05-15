import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Link, useNavigate } from 'react-router';
import styles from './FoodActionCard.module.scss';
import { deleteProducts } from '@/entities/product';
import { deleteDishes } from '@/entities/dish';
import { PopoverTrigger } from '@/shared/ui/popover/PopoverTrigger';
import { isCreatedByUser } from '@/shared/lib';
import { safeMutate } from '@/shared/lib/safeMutate';
import { getProductUrl, RouterUrls } from '@/app/router';
import { CatalogProductNutrientsDrawer } from './CatalogProductNutrientsDrawer';

type Props = {
  variant: 'product' | 'dish';
  item: {
    id: string;
    name: string;
    userId?: string | null;
    categories?: string | null;
    servingBasis?: '100g' | 'serving';
    getTotalNutrients?: (qty: number) => Record<string, number>;
  };
  active?: boolean;
  onClick?: () => void;
  onAdd?: () => void;
  showDelete?: boolean;
  showAdd?: boolean;
  onInfoClick?: () => void;
  richNutrientId?: string | null;
  richNutrientUnit?: string;
  richNutrientMax?: number;
  /**
   * If provided, the name area becomes a <label htmlFor={htmlFor}> so a tap on
   * the text focuses the corresponding input (used by ModalByLabel step flows).
   * Info / delete buttons stay outside the label in the DOM, so they don't need
   * preventDefault to avoid the label's focus delegation.
   */
  htmlFor?: string;
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

const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.75" />
    <text
      x="12"
      y="17"
      textAnchor="middle"
      fill="currentColor"
      fontFamily="'Source Serif 4', 'Source Serif Pro', Georgia, 'Times New Roman', serif"
      fontStyle="italic"
      fontSize="16"
      fontWeight="300"
    >
      i
    </text>
  </svg>
);

const FoodActionCard = ({
  variant,
  item,
  active,
  onClick,
  showDelete = false,
  onInfoClick,
  richNutrientId,
  richNutrientUnit,
  richNutrientMax = 0,
  htmlFor,
}: Props) => {
  const navigate = useNavigate();
  const infoHref = variant === 'product' ? getProductUrl(item.id) : RouterUrls.getDish(item.id);
  const userCreated = variant === 'dish' ? true : isCreatedByUser(item.id);
  const isCatalogProduct = variant === 'product' && !userCreated;
  const [nutrientsOpen, setNutrientsOpen] = useState(false);
  const [nutrientsMounted, setNutrientsMounted] = useState(false);

  const handleDelete = () => {
    if (variant === 'product') {
      void safeMutate(() => deleteProducts([item.id]), 'Не удалось удалить продукт');
    } else {
      void safeMutate(
        () => deleteDishes([{ id: item.id, itemIds: [], portionIds: [] }]),
        'Не удалось удалить блюдо'
      );
    }
  };

  const ownershipLabel = variant === 'product' ? 'мой' : 'моё';
  const showOwnershipLabel = userCreated;

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
    <li className={styles.wrapper} role="option">
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
      {htmlFor ? (
        <label
          htmlFor={htmlFor}
          className={clsx(styles.item, active && styles.item_active)}
          onClick={() => {
            onClick?.();
          }}
        >
          <span className={styles.name}>{item.name}</span>
          {variant === 'product' && item.servingBasis === 'serving' && (
            <span className={styles.supplementBadge}> · добавка</span>
          )}
        </label>
      ) : (
        <p
          className={clsx(styles.item, active && styles.item_active)}
          onClick={() => {
            onClick?.();
          }}
        >
          <span className={styles.name}>{item.name}</span>
          {variant === 'product' && item.servingBasis === 'serving' && (
            <span className={styles.supplementBadge}> · добавка</span>
          )}
        </p>
      )}
      {onInfoClick && (
        isCatalogProduct ? (
          <button
            type="button"
            className={styles.infoBtn}
            aria-label="Нутриенты"
            onClick={() => {
              setNutrientsMounted(true);
              setNutrientsOpen(true);
            }}
          >
            <InfoIcon />
            {showOwnershipLabel && (
              <span className={styles.ownershipLabel}>{ownershipLabel}</span>
            )}
          </button>
        ) : (
          <Link
            to={infoHref}
            className={styles.infoBtn}
            aria-label="Информация"
            onClick={(e) => {
              // Let cmd/ctrl/middle-click open in a new tab without closing the modal.
              if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              onInfoClick();
              navigate(infoHref);
            }}
          >
            <InfoIcon />
            {showOwnershipLabel && (
              <span className={styles.ownershipLabel}>{ownershipLabel}</span>
            )}
          </Link>
        )
      )}
      {isCatalogProduct && nutrientsMounted && (
        <CatalogProductNutrientsDrawer
          open={nutrientsOpen}
          onOpenChange={setNutrientsOpen}
          productId={item.id}
          productName={item.name}
        />
      )}
    </li>
  );
};

export default FoodActionCard;
