import { useMemo } from 'react';
import clsx from 'clsx';
import TickIcon from '@/shared/assets/icons/tick.svg?react';
import { useViewTransitionNavigate } from '@/shared/lib/viewTransition';
import styles from './FoodActionCard.module.scss';
import { deleteProducts } from '@/entities/product';
import { deleteDishes } from '@/entities/dish';
import { PopoverTrigger } from '@/shared/ui/popover/PopoverTrigger';
import { isCreatedByUser } from '@/shared/lib';
import { findCatalogProduct } from '@/shared/data/catalog';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import { safeMutate } from '@/shared/lib/safeMutate';
import { RouterUrls } from '@/app/router';
import { drawerStore } from '@/shared/ui/drawer-store';
import { ProductDrawer } from '@/features/food/product-drawer';
import { Text, QuietLabel, Numeral } from '@/shared/ui/atoms/Typography';
import { formatNormPercent } from './formatNormPercent';

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

// Богатство нутриентом: тускло-серый (мало) → мягкий жёлтый (середина) →
// бледный светло-зелёный с желтизной (богато). Верх НЕ насыщенно-зелёный, а
// лёгкий жёлто-зелёный, уходящий в бледно-жёлтый.
const RICHNESS_COLORS = [
  '#c6c5bf', // 0: none — тусклый серый
  '#d4cfa6', // very low — серо-жёлтый
  '#e0d589', // low-mid — приглушённый жёлтый
  '#e7d771', // mid — мягкий жёлтый
  '#dcd96f', // жёлто-зелёный (бледный)
  '#cdda77', // лайм к жёлтому (бледный)
  '#bfdb80', // светло-зелёный, к жёлтому
  '#b2da84', // rich — лёгкий бледный жёлто-зелёный
] as const;

// Achromatic richness ramp — opt-in via the `monoRichness` prop for a
// strict-monochrome host. Magnitude still reads, via value (light→dark gray)
// instead of hue. Latent capability: SearchFood no longer requests it (its
// paper-mono tone uses the colour ramp), but the prop stays for reuse.
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
      style={{ fontFamily: 'var(--sys-text-family-serif)' }}
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
  // Только dish-инфо-кнопка навигирует на страницу (продукт открывает
  // ProductDrawer, см. ниже), поэтому цель всегда /dish/:id. Раскадровка 'push'
  // (iOS-навигация: новая страница въезжает справа, старая параллаксит влево);
  // cover (снизу) остаётся за секцией «Анализ по неделям». state.heroName даёт
  // DishPage показать имя сразу, пока блюдо грузится из Dexie.
  const goToInfo = useViewTransitionNavigate(RouterUrls.getDish(item.id), 'push', {
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

  // Подпись-вид под названием: блюдо → «блюдо» (блюда всегда созданы юзером),
  // свой продукт → «мой продукт», каталожный продукт → ничего. Добавка (продукт
  // с serving-basis) дописывается в ту же строку через серединную точку:
  // «мой продукт · добавка» (раньше «добавка» висела отдельной плашкой справа).
  const kindLabel = variant === 'product' ? 'мой продукт' : 'блюдо';
  const showKindLabel = userCreated;
  const isSupplement = variant === 'product' && item.servingBasis === 'serving';
  const subtitle = [showKindLabel ? kindLabel : null, isSupplement ? 'добавка' : null]
    .filter(Boolean)
    .join(' · ');

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
              <Text as="span" role="label">
                Удалить {variant === 'product' ? 'продукт' : 'блюдо'}
              </Text>
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
    <li className={styles.wrapper} role="option" aria-selected={active || undefined} data-pressed={pressed || undefined}>
      {/* Маркер «выбрано» = navy-кромка (см. scss) + галочка в светлом бейдже,
          правый-верхний угол. Без заливки — текст карточки остаётся тёмным
          (единая идиома с Choice/нормой/TimeChoose, sys-токены «выбрано»). */}
      {active && (
        <span className={styles.tick} aria-hidden>
          <TickIcon />
        </span>
      )}
      {richNutrientValue !== null && (
        <span className={styles.richValue}>
          {/* Цветная заливка квадрата (ширина = доля богатства, слева направо),
              под числами (z-index:-1). Re-key по нутриенту → растёт заново. */}
          {richness > 0 && (
            <span
              key={`fill-${richNutrientId}`}
              className={styles.richValueFill}
              style={{ width: `${richness * 100}%`, backgroundColor: richnessColor }}
              aria-hidden
            />
          )}
          <Numeral size="sm" weight="semibold">
            {richNutrientValue > 0 ? richNutrientValue.toFixed(1) : '—'}
          </Numeral>
          {richNutrientValue > 0 && richNutrientUnit && (
            <Text as="span" role="caption" className={styles.richUnit}>
              {richNutrientUnit}
            </Text>
          )}
          {normPercent && (
            <Numeral as="span" size="sm" weight="semibold" className={styles.richPercent}>
              {normPercent}
            </Numeral>
          )}
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
          <Text as="span" role="body" className={styles.name}>
            {item.name}
          </Text>
          {subtitle && <QuietLabel className={styles.kindLabel}>{subtitle}</QuietLabel>}
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
          <Text as="span" role="body" className={styles.name}>
            {item.name}
          </Text>
          {subtitle && <QuietLabel className={styles.kindLabel}>{subtitle}</QuietLabel>}
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
          </button>
        ))}
    </li>
  );
};

export default FoodActionCard;
