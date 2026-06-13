import { useMemo } from 'react';
import clsx from 'clsx';
import { useViewTransitionNavigate } from '@/shared/lib/viewTransition';
import styles from './FoodActionCard.module.scss';
import { deleteProducts } from '@/entities/product';
import { deleteDishes } from '@/entities/dish';
import { PopoverTrigger } from '@/shared/ui/popover/PopoverTrigger';
import { isCreatedByUser } from '@/shared/lib';
import { findCatalogProduct } from '@/shared/data/catalog';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import { safeMutate } from '@/shared/lib/safeMutate';
import { getProductUrl, RouterUrls } from '@/app/router';
import { drawerStore } from '@/shared/ui/drawer-store';
import { ProductDrawer } from '@/features/food/product-drawer';

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
  /** Суточная норма выбранного нутриента (в его единице). SearchFood считает её
   *  один раз (user-норма ?? дефолт) и прокидывает сюда; undefined у нутриентов
   *  без нормы — тогда процент не рисуется. */
  richNutrientNorm?: number;
  /** When true, the richness bar/value/fill use a grayscale ramp instead of the
   *  green→amber hue scale. Set by SearchFood in strict-monochrome variants so
   *  the screen stays achromatic. */
  monoRichness?: boolean;
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

// Achromatic richness ramp — used when the screen is in a strict-monochrome
// DesignBar variant (SearchFood passes `monoRichness`). Magnitude still reads,
// via value (light→dark gray) instead of hue, so the only colour on the screen
// can stay in the ambient glow.
const RICHNESS_GRAYS = [
  '#cfcfcf', // 0: none
  '#b8b8b8',
  '#9c9c9c',
  '#7e7e7e',
  '#646464',
  '#4c4c4c',
  '#363636',
  '#222222',
] as const;

function getRichnessColor(ratio: number, mono = false): string {
  const ramp = mono ? RICHNESS_GRAYS : RICHNESS_COLORS;
  if (ratio <= 0) return ramp[0];
  const idx = Math.min(Math.floor(ratio * (ramp.length - 1)), ramp.length - 1);
  return ramp[idx];
}

// «% от суточной нормы» для выбранного нутриента: значение_на_100г / норма × 100.
// Норму считает SearchFood один раз (`richNutrientNorm`) и прокидывает числом —
// у нутриентов без нормы (сахар, B7, часть аминокислот) она undefined, процент
// не рисуется, остаётся абсолютное значение + единица.
export function formatNormPercent(percent: number): string {
  if (percent > 0 && percent < 1) return `${percent.toFixed(2)}%`;
  if (percent < 10) return `${percent.toFixed(1)}%`;
  return `${Math.round(percent)}%`;
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
  richNutrientNorm,
  monoRichness = false,
  htmlFor,
}: Props) => {
  const { pressed, pressProps } = usePressFeedback();
  const infoHref = variant === 'product' ? getProductUrl(item.id) : RouterUrls.getDish(item.id);
  // Переход card→page через тот же хелпер, что и кнопка «Анализ по неделям», но
  // раскадровка 'push' (iOS-навигация: новая страница въезжает справа, старая
  // параллаксит влево). cover (снизу) остаётся за секцией «Анализ по неделям».
  // state.heroName даёт ProductPage показать имя сразу, пока продукт грузится из
  // Dexie.
  const goToInfo = useViewTransitionNavigate(infoHref, 'push', {
    state: { heroName: item.name },
  });
  const userCreated = variant === 'dish' ? true : isCreatedByUser(item.id);

  // Каталожные продукты могут нести миниатюру (build-route поле `image`); резолвим
  // прямо по id, чтобы не протягивать картинку через весь SearchFood.
  const imageSrc = variant === 'product' ? findCatalogProduct(item.id)?.image : undefined;
  const thumb = imageSrc ? (
    <img
      className={styles.thumb}
      src={imageSrc}
      alt=""
      loading="lazy"
      decoding="async"
      // If a catalog `image` path ever drifts from the shipped asset, hide the
      // thumbnail instead of showing the browser's broken-image glyph.
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  ) : null;

  const handleDelete = () => {
    if (variant === 'product') {
      void safeMutate(() => deleteProducts([item.id]), 'Не удалось удалить продукт');
    } else {
      void safeMutate(() => deleteDishes([item.id]), 'Не удалось удалить блюдо');
    }
  };

  const ownershipLabel = variant === 'product' ? 'мой продукт' : 'мое блюдо';
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

  const richnessColor =
    richNutrientValue !== null ? getRichnessColor(richness, monoRichness) : undefined;
  const normPercent =
    richNutrientValue !== null &&
    richNutrientValue > 0 &&
    richNutrientNorm != null &&
    richNutrientNorm > 0
      ? formatNormPercent((richNutrientValue / richNutrientNorm) * 100)
      : null;

  return (
    <li className={styles.wrapper} role="option" data-pressed={pressed || undefined}>
      {richNutrientValue !== null && richness > 0 && (
        <>
          {/* Заливка-гейдж: ширина = насыщенность, лежит ПОД текстом (z-index 0,
              .item поднят на z-index 1), низкая alpha + затухание вправо в
              прозрачность — имя еды всегда читаемо, без резкой непрозрачной полосы.
              `key` завязан на выбранный нутриент: при смене нутриента span
              ремаунтится → growFill (~1.6s) проигрывается заново, и юзер видит,
              как гейдж дорастает до нового уровня. */}
          <span
            key={`fill-${richNutrientId}`}
            className={styles.richFill}
            style={{
              width: `${richness * 100}%`,
              backgroundImage: `linear-gradient(90deg, ${richnessColor} 0%, ${richnessColor} 55%, transparent 100%)`,
            }}
          />
          {/* Канонический тонкий 3px вертикальный акцент слева — цвет несёт данные. */}
          <span
            key={`bar-${richNutrientId}`}
            className={styles.richBar}
            style={{ backgroundColor: richnessColor }}
          />
        </>
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
          {normPercent && <span className={styles.richPercent}>{normPercent}</span>}
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
          {...pressProps}
        >
          {thumb}
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
          {...pressProps}
        >
          {thumb}
          <span className={styles.name}>{item.name}</span>
          {variant === 'product' && item.servingBasis === 'serving' && (
            <span className={styles.supplementBadge}> · добавка</span>
          )}
        </p>
      )}
      {onInfoClick &&
        (variant === 'product' ? (
          // Продукт (свой ИЛИ каталожный) → боковой ProductDrawer. Страница
          // /product/:id инактивирована; ProductDrawer сам ветвит каталог/свой
          // по isCreatedByUser, точке входа ветвиться не нужно.
          <button
            type="button"
            className={styles.infoBtn}
            aria-label="Информация о продукте"
            onClick={() => {
              drawerStore.show(
                ProductDrawer,
                { productId: item.id, productName: item.name },
                { side: 'left', width: 'min(85vw, 360px)' }
              );
            }}
          >
            <InfoIcon />
            {showOwnershipLabel && <span className={styles.ownershipLabel}>{ownershipLabel}</span>}
          </button>
        ) : (
          // Блюдо → страница /dish/:id (та же раскадровка 'push', что и «Анализ
          // по неделям»). goToInfo → navigate(viewTransition:true).
          <button
            type="button"
            className={styles.infoBtn}
            aria-label="Информация"
            onClick={goToInfo}
          >
            <InfoIcon />
            {showOwnershipLabel && <span className={styles.ownershipLabel}>{ownershipLabel}</span>}
          </button>
        ))}
    </li>
  );
};

export default FoodActionCard;
