import { useMemo, type PointerEvent as ReactPointerEvent } from 'react';
import clsx from 'clsx';
import { InfoButton } from '@/shared/ui/atoms/Button';
import styles from './FoodActionCard.module.scss';
import { deleteProducts } from '@/entities/product';
import { deleteDishes } from '@/entities/dish';
import { isCreatedByUser } from '@/shared/lib';
import { findCatalogProduct } from '@/shared/data/catalog';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import { useLongPress } from '@/shared/lib/hooks/useLongPress';
import { safeMutate } from '@/shared/lib/safeMutate';
import { drawerStore } from '@/shared/ui/drawer-store';
import { ProductDrawer } from '@/features/food/product-drawer';
import { DishDrawer } from '@/features/food/dish-drawer';
// Конкретные файлы, не barrel — barrel тянет buildInfoActions → ProductDrawer
// (см. defensive-импорт в ProductDrawer/buildInfoActions).
import { ItemActionsDrawer } from '@/features/shared/item-actions-drawer/ItemActionsDrawer';
import { buildInfoActions } from '@/features/shared/item-actions-drawer/buildInfoActions';
import { Text, QuietLabel, Numeral } from '@/shared/ui/atoms/Typography';
import { formatNormPercent } from './formatNormPercent';
import { formatAmount } from '@/shared/lib/formatNumber';

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
  /**
   * True when the search is filtered to «Мое» (mine). The list is then all
   * user-owned, so the «мой» prefix is redundant — the kind label collapses to
   * just «продукт» / «блюдо». In the «Все» list it stays «мой продукт».
   */
  mineFilter?: boolean;
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

const FoodActionCard = ({
  variant,
  item,
  active,
  onClick,
  onInfoClick,
  richNutrientId,
  richNutrientUnit,
  richNutrientMax = 0,
  richNutrientNorm,
  monoRichness = false,
  htmlFor,
  mineFilter = false,
}: Props) => {
  const { pressed, pressProps } = usePressFeedback();
  const userCreated = variant === 'dish' ? true : isCreatedByUser(item.id);

  // Тап по ⓘ — самостоятельное действие (боковой ProductDrawer/DishDrawer), НЕ
  // выбор ряда. Гасим bubbling pointer-событий до `<li>`: без этого press-визуал
  // (usePressFeedback) и long-press (useLongPress), висящие на обёртке, ловят
  // pointerdown кнопки и весь ряд чернеет под пальцем при нажатии на ⓘ (фикс
  // 2026-07-10). Оборачивающий span = display:contents — не ломает flex-раскладку
  // ряда, но остаётся в DOM-пути события, поэтому stopPropagation работает.
  const stopRowPress = (e: ReactPointerEvent) => e.stopPropagation();

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

  // Долгий клик (~450мс, общий useLongPress: move-cancel 10px + click-suppression,
  // безопасен в скроллируемом role="option") → ItemActionsDrawer. «Инфо» через
  // buildInfoActions (продукт → ProductDrawer, блюдо → DishDrawer) — дубль с ⓘ
  // осознан. Удаление = удаление ПРОДУКТА/блюда, только для своих (каталог →
  // onDelete не передаём, дровер показывает только «инфо»).
  const openActions = () => {
    const actions = buildInfoActions(
      variant === 'dish' ? { type: 'dish', dishId: item.id } : { type: 'food', productId: item.id },
    );
    void drawerStore.show(ItemActionsDrawer, {
      title: item.name,
      actions,
      ...(userCreated ? { onDelete: handleDelete } : {}),
    });
  };

  // Жест на самой карточке (`<li>`). Press-визуал даёт usePressFeedback (вспышка
  // с MIN_HOLD на мгновенном тапе, важно для htmlFor-переходов); жест — useLongPress.
  // Оба слушают pointer на ОДНОМ узле (`<li>`): useLongPress ставит pointer-capture
  // на него, поэтому release-события usePressFeedback должны прийти туда же —
  // склеиваем перекрывающиеся хендлеры (move/clickCapture/contextMenu — из press).
  const press = useLongPress(openActions);
  const liHandlers = {
    ...press,
    onPointerDown: (e: ReactPointerEvent) => {
      pressProps.onPointerDown();
      press.onPointerDown(e);
    },
    onPointerUp: (e: ReactPointerEvent) => {
      pressProps.onPointerUp();
      press.onPointerUp(e);
    },
    onPointerCancel: (e: ReactPointerEvent) => {
      pressProps.onPointerCancel();
      press.onPointerCancel(e);
    },
    onPointerLeave: (e: ReactPointerEvent) => {
      pressProps.onPointerLeave();
      press.onPointerLeave(e);
    },
  };

  // Подпись-вид под названием: блюдо → «блюдо» (блюда всегда созданы юзером),
  // свой продукт → «мой продукт», каталожный продукт → ничего. Добавка (продукт
  // с serving-basis) дописывается в ту же строку через серединную точку:
  // «мой продукт · добавка» (раньше «добавка» висела отдельной плашкой справа).
  // В фильтре «Мое» список целиком свой → префикс «мой» избыточен, оставляем
  // только сам вид («продукт»). В «Все» свой продукт остаётся «мой продукт»,
  // чтобы отличаться от каталожных. Блюдо всегда «блюдо» (всегда своё).
  const kindLabel =
    variant === 'product' ? (mineFilter ? 'продукт' : 'мой продукт') : 'блюдо';
  const showKindLabel = userCreated;
  const isSupplement = variant === 'product' && item.servingBasis === 'serving';
  const subtitle = [showKindLabel ? kindLabel : null, isSupplement ? 'добавка' : null]
    .filter(Boolean)
    .join(' · ');

  // Правый слот = ВСЕГДА тихий ⓘ (ровная info-колонка; встаёт под кнопку фильтра
  // верхнего бара). Вид-подпись («мой продукт» / «блюдо · добавка») живёт тихой
  // строкой ПОД именем (см. .kindLabel в nameCol). Раньше подпись подменяла ⓘ в
  // слоте у своих рядов — в режиме «Мое», где ВСЕ ряды свои, это давало колонку
  // курсива, переливавшуюся за экран (запрос юзера пофиксить).
  const showSubtitleUnderName = Boolean(subtitle);

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
    <li
      className={styles.wrapper}
      role="option"
      aria-selected={active || undefined}
      aria-haspopup="menu"
      data-pressed={pressed || undefined}
      // Есть миниатюра → divider стартует под именем (за кружком); без неё
      // (блюда, свои продукты, режим «Мое») — от page-gutter. См. .module.scss.
      data-has-thumb={imageSrc ? '' : undefined}
      {...liHandlers}
    >
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
          {/* Число + единица в ОДНОЙ строке (baseline-aligned): единица —
              тихий строчный хвостик справа от числа. Раньше единица стояла
              отдельной третьей строкой → три строки не влезали в 44px по высоте
              и верхнее число подрезалось overflow:hidden при включённой сортировке. */}
          <span className={styles.richValueTop}>
            <Numeral size="sm" weight="semibold">
              {richNutrientValue > 0 ? formatAmount(richNutrientValue) : '—'}
            </Numeral>
            {richNutrientValue > 0 && richNutrientUnit && (
              <Text as="span" role="caption" className={styles.richUnit}>
                {richNutrientUnit}
              </Text>
            )}
          </span>
          {normPercent && (
            <Numeral as="span" size="sm" weight="semibold" className={styles.richPercent}>
              {normPercent}
            </Numeral>
          )}
        </span>
      )}
      {htmlFor ? (
        <label
          htmlFor={htmlFor}
          className={clsx(styles.item, active && styles.item_active)}
          onClick={() => {
            onClick?.();
          }}
        >
          {thumb}
          <span className={styles.nameCol}>
            <Text as="span" role="label" className={styles.name}>
              {item.name}
            </Text>
            {showSubtitleUnderName && (
              <QuietLabel className={styles.kindLabel}>{subtitle}</QuietLabel>
            )}
          </span>
        </label>
      ) : (
        <p
          className={clsx(styles.item, active && styles.item_active)}
          onClick={() => {
            onClick?.();
          }}
        >
          {thumb}
          <span className={styles.nameCol}>
            <Text as="span" role="label" className={styles.name}>
              {item.name}
            </Text>
            {showSubtitleUnderName && (
              <QuietLabel className={styles.kindLabel}>{subtitle}</QuietLabel>
            )}
          </span>
        </p>
      )}
      {onInfoClick && (
        <span
          className={styles.infoSlot}
          onPointerDown={stopRowPress}
          onPointerUp={stopRowPress}
          onPointerCancel={stopRowPress}
        >
          {variant === 'product' ? (
            // Продукт (свой ИЛИ каталожный) → боковой ProductDrawer. Страница
            // /product/:id инактивирована; ProductDrawer сам ветвит каталог/свой
            // по isCreatedByUser, точке входа ветвиться не нужно.
            <InfoButton
              className={styles.infoBtn}
              emphasis="quiet"
              size={56}
              aria-label="Информация о продукте"
              onClick={() => {
                drawerStore.show(
                  ProductDrawer,
                  { productId: item.id, productName: item.name },
                  { side: 'left', width: 'min(85vw, 360px)' }
                );
              }}
            />
          ) : (
            // Блюдо → боковой DishDrawer (read-only превью: состав + суммарные
            // нутриенты, стрелка в шапке → страница /dish/:id). Оверлей вместо
            // навигации сохраняет скролл SearchFood + открытую модалку Home
            // (симметрия с продуктом).
            <InfoButton
              className={styles.infoBtn}
              emphasis="quiet"
              size={56}
              aria-label="Информация о блюде"
              onClick={() => {
                drawerStore.show(
                  DishDrawer,
                  { dishId: item.id, dishName: item.name },
                  { side: 'left', width: 'min(85vw, 360px)' }
                );
              }}
            />
          )}
        </span>
      )}
      {/* Маркер «своё»: нейтральная вертикальная полоска у правого края карточки
          (свои продукты + блюда, в обоих фильтрах). Не цветная — это признак
          владения, а не данные (цвет несёт левый квадрат-гейдж richValue). */}
      {userCreated && <span className={styles.ownerStripe} aria-hidden />}
    </li>
  );
};

export default FoodActionCard;
