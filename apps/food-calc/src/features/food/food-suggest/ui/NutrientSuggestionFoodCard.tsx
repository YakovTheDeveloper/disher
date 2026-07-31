import type { PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { InfoButton } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Typography';
import { FoodListRow } from '@/shared/ui/FoodListRow';
import { GaugeFill, NormFigure } from '@/shared/ui/NormGauge';
import { drawerStore } from '@/shared/ui/drawer-store';
import { findCatalogProduct } from '@/shared/data/catalog';
import { safeMutate } from '@/shared/lib/safeMutate';
import { formatAmount, formatPctDisplay } from '@/shared/lib/formatNumber';
import { addToBlacklist } from '@/entities/product-blacklist';
import { nutrientRowName } from '@/entities/nutrient/ui/NutrientGroup/constants';
import type { Suggestion } from '@/shared/lib/suggest';
import { ProductDrawer } from '@/features/food/product-drawer';
import { DishDrawer } from '@/features/food/dish-drawer';
import { QUICK_VIEW_DRAWER_OPTIONS } from '@/features/food/quick-view-drawer';
// Конкретный файл, не barrel — barrel тянет buildInfoActions → ProductDrawer
// (та же осторожность, что в FoodActionCard).
import { ItemActionsDrawer } from '@/features/shared/item-actions-drawer/ItemActionsDrawer';
import styles from './NutrientSuggestionFoodCard.module.scss';

type Props = {
  suggestion: Suggestion;
  /** Тап по ряду — добавление в рацион (хост решает: напрямую или через флоу). */
  onSelect: () => void;
};

/**
 * Ряд предложки «Что доесть?» — адаптер на скелете shared/ui/FoodListRow
 * (шаг 4 плана tds/task_spec/ЧтоЕщеСъесть.md). Числовая колонка = готовые
 * примитивы shared/ui/NormGauge: GaugeFill (уровень = score/100) + NormFigure
 * со score; подпись «% остатка» — не часть примитива, рендерится рядом (шаг 3.2).
 */
const NutrientSuggestionFoodCard = ({ suggestion, onSelect }: Props) => {
  const { t } = useTranslation();
  const { ref, portionGrams, portionUnit: servingUnit, score, topCovers } = suggestion;

  // Юнит порции приезжает в suggestion (servingUnit продукта протянут скорингом
  // из мапы оркестратора) — per-row useProduct здесь НАМЕРЕННО нет: 20 рядов ×
  // liveQuery по полному каталогу — лишний каскад подписок (ревью 2026-07-31).
  // У БАД (serving-basis) порция = 1 доза с юнитом продукта, у еды/блюд — «г».
  const portionUnit = servingUnit ?? t('suggest.card.grams', 'г');

  // Каталожная миниатюра — как в FoodActionCard: резолвим по id из build-route
  // поля `image`. У блюд и юзерских продуктов картинок нет → слот пуст.
  const imageSrc = ref.kind === 'product' ? findCatalogProduct(ref.id)?.image : undefined;
  const thumb = imageSrc ? (
    <img
      className={styles.thumb}
      src={imageSrc}
      alt=""
      loading="lazy"
      decoding="async"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  ) : null;

  const openInfo = () => {
    if (ref.kind === 'dish') {
      void drawerStore.show(DishDrawer, { dishId: ref.id, dishName: ref.name }, QUICK_VIEW_DRAWER_OPTIONS);
    } else {
      void drawerStore.show(ProductDrawer, { productId: ref.id, productName: ref.name }, QUICK_VIEW_DRAWER_OPTIONS);
    }
  };

  // Тап по ⓘ — самостоятельное действие (quick-view), не выбор ряда: гасим
  // bubbling pointer-событий до <li> (тот же фикс, что в FoodActionCard).
  const stopRowPress = (e: ReactPointerEvent) => e.stopPropagation();

  // Long-press → меню действий. Пункт «Не предлагать» — ТОЛЬКО для продуктов:
  // blacklist ключуется по product_id (entities/product-blacklist), для блюд он
  // не работает — пункт осознанно скрыт (если понадобится — нужен dish-blacklist).
  const openActions = () => {
    void drawerStore.show(ItemActionsDrawer, {
      title: ref.name,
      subtitle: t('suggest.actions.subtitle', 'Действия'),
      nutrientsAction: {
        label: t('suggest.actions.viewNutrients', 'Нутриенты'),
        onClick: openInfo,
      },
      ...(ref.kind === 'product'
        ? {
            deleteLabel: t('suggest.actions.dontSuggest', 'Не предлагать'),
            onDelete: () => {
              void safeMutate(
                () => addToBlacklist(ref.id),
                t('suggest.actions.blacklistFailed', 'Не удалось скрыть продукт'),
              );
            },
          }
        : {}),
    });
  };

  // Детализация под именем: строка порции + по строке на каждый покрываемый
  // дефицит («Белок — закроет 34%»). Курсивный QuietLabel здесь осознанно НЕ
  // используется (запрос 2026-07-31: курсив — устаревший голос) — тихость даёт
  // роль caption у <Text> + faint-цвет.
  const coverLines = topCovers.map((c) => ({
    id: c.nutrientId,
    text: t('suggest.card.coverLine', '{{name}} — закроет {{pct}}%', {
      name: nutrientRowName(c.nutrientId).name,
      pct: formatPctDisplay(c.pct),
    }),
  }));

  const subtitle = (
    <span className={styles.details}>
      <Text as="span" role="caption" className={styles.portionLine}>
        {formatAmount(portionGrams)} {portionUnit}
      </Text>
      {coverLines.map((line) => (
        <Text as="span" role="caption" className={styles.coverLine} key={line.id}>
          {line.text}
        </Text>
      ))}
    </span>
  );

  return (
    <FoodListRow
      className={styles.card}
      role="option"
      ariaSelected={false}
      onClick={onSelect}
      onLongPress={openActions}
      leading={thumb ?? undefined}
      title={
        <Text as="span" role="label" className={styles.name}>
          {ref.name}
        </Text>
      }
      subtitle={subtitle}
      meta={
        <span className={styles.rich}>
          <NormFigure className={styles.richNums} value={formatAmount(score, 0)} />
          <Text as="span" role="caption" className={styles.scoreCaption}>
            {t('suggest.card.scoreCaption', '% остатка')}
          </Text>
          <GaugeFill className={styles.richTrack} level={score / 100} />
        </span>
      }
      trailing={
        <span
          className={styles.infoSlot}
          onPointerDown={stopRowPress}
          onPointerUp={stopRowPress}
          onPointerCancel={stopRowPress}
        >
          <InfoButton
            className={styles.infoBtn}
            emphasis="quiet"
            size={56}
            aria-label={
              ref.kind === 'dish'
                ? t('suggest.card.dishInfo', 'Информация о блюде')
                : t('suggest.card.productInfo', 'Информация о продукте')
            }
            onClick={openInfo}
          />
        </span>
      }
    />
  );
};

export default NutrientSuggestionFoodCard;
