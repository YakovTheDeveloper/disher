import { useMemo, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
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
import { Text, QuietLabel, Numeral, NumeralMarker } from '@/shared/ui/atoms/Typography';
import { ArcLabel } from '@/shared/ui/ArcLabel/ArcLabel';
import { formatAmount, formatPercent } from '@/shared/lib/formatNumber';

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

  // Режим «Мое»: в слоте миниатюры (в «Мое» она всегда пуста — свои продукты не в
  // каталоге, у блюд картинок нет) рисуем вид ПО ДУГЕ — «блюдо» / «продукт», разными
  // цветами (штемпель-стемпель, паттерн дуговой надписи из «Новая еда»). Он же несёт
  // вид вместо тихой подписи-под-именем (та в «Мое» гасится, см. showKindLabel ниже).
  const kindBadge = mineFilter ? (
    <ArcLabel
      text={variant === 'dish' ? 'блюдо' : 'продукт'}
      // Блюдо — дуга вывернута вниз (долина), продукт — арка вверх: вид читается
      // и цветом, и формой дуги.
      flip={variant === 'dish'}
      className={clsx(styles.kindBadge, variant === 'dish' ? styles.kindBadge_dish : styles.kindBadge_product)}
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
  // В «Мое» вид переехал на дуговой бейдж (kindBadge) в слоте миниатюры, а тихую
  // подпись-под-именем убираем ЦЕЛИКОМ (запрос юзера) — карточка читается как
  // обычная, имя одно. В «Все» подпись остаётся прежней.
  const showKindLabel = userCreated && !mineFilter;
  const isSupplement = variant === 'product' && item.servingBasis === 'serving';
  const subtitle = [showKindLabel ? kindLabel : null, isSupplement ? 'добавка' : null]
    .filter(Boolean)
    .join(' · ');

  // Правый слот = ВСЕГДА тихий ⓘ (ровная info-колонка; встаёт под кнопку фильтра
  // верхнего бара). Вид-подпись («мой продукт» / «блюдо · добавка») живёт тихой
  // строкой ПОД именем (см. .kindLabel в nameCol). Раньше подпись подменяла ⓘ в
  // слоте у своих рядов — в режиме «Мое», где ВСЕ ряды свои, это давало колонку
  // курсива, переливавшуюся за экран (запрос юзера пофиксить).
  const showSubtitleUnderName = Boolean(subtitle) && !mineFilter;

  const richNutrientValue =
    richNutrientId && item.getTotalNutrients
      ? (item.getTotalNutrients(100)[richNutrientId] ?? 0)
      : null;

  const richness = useMemo(() => {
    if (richNutrientValue === null || richNutrientMax <= 0) return 0;
    return Math.min(richNutrientValue / richNutrientMax, 1);
  }, [richNutrientValue, richNutrientMax]);

  // % от суточной нормы — БЕЗ знака: число и «%» разведены (число несёт цвет-
  // акцент, «%» — тихий маркер), знак дорисовывает <NumeralMarker kind="sign">.
  const normPercent =
    richNutrientValue !== null &&
    richNutrientValue > 0 &&
    richNutrientNorm != null &&
    richNutrientNorm > 0
      ? formatPercent((richNutrientValue / richNutrientNorm) * 100)
      : null;

  return (
    <li
      className={styles.wrapper}
      role="option"
      aria-selected={active || undefined}
      aria-haspopup="menu"
      data-pressed={pressed || undefined}
      // Есть миниатюра ИЛИ дуговой бейдж «Мое» → имя уезжает за слот, divider
      // стартует от края (0); без них — от page-gutter. См. .module.scss.
      data-has-thumb={imageSrc || kindBadge ? '' : undefined}
      {...liHandlers}
    >
      {htmlFor ? (
        <label
          htmlFor={htmlFor}
          className={clsx(styles.item, active && styles.item_active)}
          onClick={() => {
            onClick?.();
          }}
        >
          {thumb ?? kindBadge}
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
          {thumb ?? kindBadge}
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
      {/* Богатство нутриентом = тихая правая колонка чисел + «термометр»-заливка
          ряда (ghost-row). Трек absolute внутри непозиционированной `.rich`
          разрешается относительно `.wrapper` → бледная заливка кроет весь ряд
          слева направо на долю богатства. См. .module.scss. */}
      {richNutrientValue !== null && (
        <span className={styles.rich}>
          {/* 2×2 грид: колонка чисел (право-выровнены) + колонка маркеров (лево-
              выровнены). Единицы и «%» садятся на ОДНУ вертикаль — границу колонок
              грида (как выровненный жёлоб дровера, но без absolute-свисания: у
              карточки справа стоит ⓘ, свисать некуда). Ячейки размещены явно
              (grid-column/row), поэтому пропуск единицы/процента не смещает
              соседей. */}
          <span className={styles.richNums}>
            <Numeral size="sm" weight="semibold" className={styles.richCellValue}>
              {richNutrientValue > 0 ? formatAmount(richNutrientValue) : '—'}
            </Numeral>
            {richNutrientValue > 0 && richNutrientUnit && (
              <NumeralMarker kind="unit" className={styles.richCellUnit}>
                {richNutrientUnit}
              </NumeralMarker>
            )}
            {normPercent && (
              <>
                <Numeral size="sm" weight="semibold" className={styles.richCellPercent}>
                  {normPercent}
                </Numeral>
                <NumeralMarker kind="sign" className={styles.richCellSign}>
                  %
                </NumeralMarker>
              </>
            )}
          </span>
          <span className={styles.richTrack} aria-hidden>
            {/* Re-key по нутриенту → заливка растёт заново при смене фильтра.
                Уровень едет через --rich (scaleX), а не width — композит-only. */}
            {richness > 0 && (
              <span
                key={`fill-${richNutrientId}`}
                className={styles.richFill}
                style={{ '--rich': richness } as CSSProperties}
              />
            )}
          </span>
        </span>
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
      {/* Маркер «своё»: нейтральная вертикальная полоска у правого края карточки.
          Не цветная — это признак владения, а не данные (цвет несёт левый квадрат-
          гейдж богатства). В режиме «Мое» список целиком свой → маркер избыточен,
          гасим (карточки читаются как обычные, вид несёт дуговой бейдж слева). */}
      {userCreated && !mineFilter && <span className={styles.ownerStripe} aria-hidden />}
    </li>
  );
};

export default FoodActionCard;
