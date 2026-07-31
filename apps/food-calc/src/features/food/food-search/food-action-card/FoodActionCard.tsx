import { useMemo, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router';
import clsx from 'clsx';
import { InfoButton } from '@/shared/ui/atoms/Button';
import styles from './FoodActionCard.module.scss';
import { deleteProducts } from '@/entities/product';
import { deleteDishes } from '@/entities/dish';
import { isCreatedByUser } from '@/shared/lib';
import { findCatalogProduct } from '@/shared/data/catalog';
import { safeMutate } from '@/shared/lib/safeMutate';
import { drawerStore } from '@/shared/ui/drawer-store';
import { FoodListRow } from '@/shared/ui/FoodListRow';
import { ProductDrawer } from '@/features/food/product-drawer';
import { DishDrawer } from '@/features/food/dish-drawer';
import { QUICK_VIEW_DRAWER_OPTIONS } from '@/features/food/quick-view-drawer';
// Конкретные файлы, не barrel — barrel тянет buildInfoActions → ProductDrawer
// (см. defensive-импорт в ProductDrawer/buildInfoActions).
import { ItemActionsDrawer } from '@/features/shared/item-actions-drawer/ItemActionsDrawer';
import { buildInfoActions } from '@/features/shared/item-actions-drawer/buildInfoActions';
import { Text, QuietLabel } from '@/shared/ui/atoms/Typography';
import { GaugeFill, NormFigure } from '@/shared/ui/NormGauge';
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

// Карточка результата поиска — адаптер на скелете shared/ui/FoodListRow
// (2026-07-31, шаг 3 плана tds/task_spec/ЧтоЕщеСъесть.md): раскладка, divider,
// plum/press-состояния и жесты (usePressFeedback + useLongPress) — в каркасе;
// здесь остаётся фичевая начинка слотов (каталог, дроверы, удаление, бейджи).
// Контекстные флипы цвета (plum/press) висят на якоре .card + data-атрибуты
// каркаса — см. .module.scss.
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
  const navigate = useNavigate();
  const userCreated = variant === 'dish' ? true : isCreatedByUser(item.id);

  // Тап по ⓘ — самостоятельное действие (нижний quick-view ProductDrawer/
  // DishDrawer), НЕ выбор ряда. Гасим bubbling pointer-событий до `<li>`: без этого press-визуал
  // и long-press каркаса, висящие на обёртке, ловят pointerdown кнопки и весь ряд
  // чернеет под пальцем при нажатии на ⓘ (фикс 2026-07-10). Оборачивающий span =
  // display:contents — не ломает flex-раскладку ряда, но остаётся в DOM-пути
  // события, поэтому stopPropagation работает.
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

  // Долгий клик → ItemActionsDrawer. Ряд «Нутриенты» открывает тот же
  // быстрый нижний дровер, что и ⓘ (витрина read-only, доступна и каталогу).
  // Кнопка ↗ в хедере — переход на СТРАНИЦУ сущности: только свои продукты и блюда
  // (у каталожных страницы нет — гейта isCatalogId внутри buildInfoActions, как
  // pageRoute в ProductDrawer). Удаление = удаление ПРОДУКТА/блюда, только для своих.
  const openInfo = () => {
    if (variant === 'dish') {
      void drawerStore.show(DishDrawer, { dishId: item.id, dishName: item.name }, QUICK_VIEW_DRAWER_OPTIONS);
    } else {
      void drawerStore.show(ProductDrawer, { productId: item.id, productName: item.name }, QUICK_VIEW_DRAWER_OPTIONS);
    }
  };
  const openActions = () => {
    void drawerStore.show(ItemActionsDrawer, {
      title: item.name,
      pageAction: buildInfoActions(
        variant === 'dish'
          ? { type: 'dish', dishId: item.id }
          : { type: 'food', productId: item.id },
        navigate,
      )[0],
      nutrientsAction: { label: 'Нутриенты', onClick: openInfo },
      ...(userCreated ? { onDelete: handleDelete } : {}),
    });
  };

  // Подпись-вид под названием: блюдо → «блюдо» (блюда всегда созданы юзером),
  // свой продукт → «мой продукт», каталожный продукт → ничего. Добавка (продукт
  // с serving-basis) дописывается в ту же строку через серединную точку:
  // «мой продукт · добавка». В фильтре «Мое» список целиком свой → префикс «мой»
  // избыточен, оставляем только сам вид («продукт»). В «Все» свой продукт остаётся
  // «мой продукт», чтобы отличаться от каталожных. Блюдо всегда «блюдо» (всегда своё).
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
    <FoodListRow
      className={styles.card}
      role="option"
      active={active}
      onClick={onClick}
      onLongPress={openActions}
      htmlFor={htmlFor}
      leading={thumb ?? kindBadge}
      title={
        <Text as="span" role="label" className={styles.name}>
          {item.name}
        </Text>
      }
      subtitle={
        showSubtitleUnderName ? (
          <QuietLabel className={styles.kindLabel}>{subtitle}</QuietLabel>
        ) : undefined
      }
      meta={
        // Богатство нутриентом = тихая правая колонка чисел + «термометр»-заливка
        // ряда (ghost-row). Трек absolute внутри непозиционированной `.rich`
        // разрешается относительно позиционированного <li> каркаса → бледная
        // заливка кроет весь ряд слева направо на долю богатства.
        richNutrientValue !== null ? (
          <span className={styles.rich}>
            {/* Гейдж — общий shared/ui/NormGauge; карточные классы richNums/
                richTrack висят якорями на его корнях: plum/press-флипы цветов
                остаются в модуле карточки. */}
            <NormFigure
              className={styles.richNums}
              pctClassName={styles.richCellPercent}
              value={richNutrientValue > 0 ? formatAmount(richNutrientValue) : null}
              unit={richNutrientUnit}
              pct={normPercent}
            />
            <GaugeFill className={styles.richTrack} level={richness} />
          </span>
        ) : undefined
      }
      trailing={
        // Правый слот = ВСЕГДА тихий ⓘ (ровная info-колонка; встаёт под кнопку
        // фильтра верхнего бара). Кнопка 56px держит высоту ряда (см. FoodListRow).
        onInfoClick ? (
          <span
            className={styles.infoSlot}
            onPointerDown={stopRowPress}
            onPointerUp={stopRowPress}
            onPointerCancel={stopRowPress}
          >
            {variant === 'product' ? (
              // Продукт (свой ИЛИ каталожный) → нижний quick-view ProductDrawer
              // (две фазы snap). Редактирование живёт на странице /product/:id
              // (стрелка в шапке дровера); ProductDrawer сам ветвит каталог/свой
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
                    QUICK_VIEW_DRAWER_OPTIONS,
                  );
                }}
              />
            ) : (
              // Блюдо → нижний quick-view DishDrawer (read-only превью: состав +
              // суммарные нутриенты, стрелка в шапке → страница /dish/:id). Оверлей
              // вместо навигации сохраняет скролл SearchFood + открытую модалку Home
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
                    QUICK_VIEW_DRAWER_OPTIONS,
                  );
                }}
              />
            )}
          </span>
        ) : undefined
      }
      overlay={
        // Маркер «своё»: нейтральная вертикальная полоска у правого края карточки.
        // Не цветная — это признак владения, а не данные (цвет несёт гейдж
        // богатства). В режиме «Мое» список целиком свой → маркер избыточен,
        // гасим (карточки читаются как обычные, вид несёт дуговой бейдж слева).
        userCreated && !mineFilter ? (
          <span className={styles.ownerStripe} aria-hidden />
        ) : undefined
      }
    />
  );
};

export default FoodActionCard;
