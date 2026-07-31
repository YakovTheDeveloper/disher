import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { NormLegendButton } from '@/features/dailyNorms/NormLegendButton';
import { NutrientMatrixModal } from '@/features/dailyNorms/NutrientMatrixModal';
import { NutrientTotals } from '@/entities/nutrient/ui/NutrientTotals';
import { OpenPageGlyph } from '@/shared/ui/atoms/OpenPageGlyph';
import ListIcon from '@/shared/assets/icons/list.svg?react';
import { modalStore } from '@/shared/ui';
import { IconButton } from '@/shared/ui/atoms/Button';
import { Select, type SelectOption } from '@/shared/ui/atoms/Select';
import { Text } from '@/shared/ui/atoms/Typography';
import { useViewTransitionNavigate } from '@/shared/lib/viewTransition';
import { preloadRoute } from '@/shared/lib/routing/preloadRoute';
import { useNutrientTotals } from '@/shared/lib/useNutrientTotals';
import { capitalizeFirst } from '@/shared/lib/text/capitalizeFirst';
// Тип карты нутриентов алиасим: имя `NutrientTotals` заняла витрина из entities.
import type { NutrientTotals as NutrientTotalsMap } from '@/shared/lib/nutrients';
import type { DrawerOptions } from '@/shared/ui/overlay-types';
import type { BaseDrawerProps } from '@/shared/ui';
import s from './NutrientShowcaseDrawer.module.scss';

/**
 * Snap-высоты нижнего дровера-витрины нутриентов — общие для ВСЕХ консумеров
 * (ProductDrawer/DishDrawer/NutrientsDrawer), поэтому объявлены здесь, а не на
 * каждом call-site: так фазы не разъедутся между поверхностями. Значения — доли
 * высоты вьюпорта (грамматика Base UI: 0..1 = доля, >1 = px, строка = CSS-длина).
 *
 *  - фаза-1 `0.62` — открывающая высота. Порядок контента (шапка с именем →
 *    ряд базиса с селектом → базовая группа БЖУ) выводит самое важное наверх.
 *    ⚠️ 2026-07-25: витрина стала hero-ведомостью боксов 3×2 (Энергия · Вода ·
 *    Клетчатка / Белки · Жиры · Углеводы) + «в т.ч.»-футер + плотные таблицы
 *    микро-групп — по высоте близко к прежней единой таблице БЖУ (2026-07-24),
 *    хвост (минералы/витамины/аминокислоты + легенда нормы) по-прежнему может
 *    уходить под сгиб 0.62 на низких экранах; фаза-2 (0.92) открывает его
 *    перетаскиванием. Если тесно — поднять defaultSnapPoint. Внутренний скролл
 *    на этой фазе НЕ включён — низкие группы открываются перетаскиванием вверх.
 *  - фаза-2 `0.92` — почти во весь экран: весь контент уже смонтирован, здесь
 *    лишь больше места под внутренний скролл.
 */
export const QUICK_VIEW_SNAP_POINTS: (number | string)[] = [0.62, 0.92];

/**
 * Готовые опции `drawerStore.show(...)` для дровера-витрины нутриентов — все
 * консумеры открываются ОДНИМ и тем же объектом, поэтому side/snap не могут
 * разойтись: `drawerStore.show(ProductDrawer, { productId }, QUICK_VIEW_DRAWER_OPTIONS)`.
 */
export const QUICK_VIEW_DRAWER_OPTIONS = {
  side: 'bottom',
  snapPoints: QUICK_VIEW_SNAP_POINTS,
  defaultSnapPoint: QUICK_VIEW_SNAP_POINTS[0],
  // Слабенький скрим (треть базы): витрина плотная, страница под листом должна
  // читаться; тап по фону закрывает (2026-07-25, запрос).
  softBackdrop: true,
} satisfies DrawerOptions;

interface NutrientShowcaseDrawerProps extends BaseDrawerProps {
  /** Заголовок шапки (капитализируется тут): имя сущности или «Нутриенты». */
  title: string;
  /** Тихий контекст под заголовком: «Пищевая ценность» / «За весь день» / «За блюдо». */
  subtitle: string;
  /**
   * Готовый URL страницы сущности. Передан → в topRight-слоте шапки появляется
   * кнопка «Открыть страницу»; read-only витрины (день/блюдо из расписания)
   * страницы не имеют и проп не передают.
   */
  pageRoute?: string;
  /** Имя для мгновенной шапки страницы (едет в nav-state). */
  heroName?: string;
  /** Пункты селекта порции/количества (адаптер строит под сущность). */
  portionOptions?: SelectOption[];
  /** value выбранного пункта селекта. */
  selectedPortion?: string;
  onSelectPortion?: (value: string) => void;
  /**
   * Когда `portionOptions` пуст (супплемент/БАД — нет граммовых опор), базис чисел
   * не самоочевиден. Тихий статичный бейдж («за порцию») в ряду-заголовке БЖУ
   * говорит, НА ЧТО приведены значения, без интерактива. Еда его не передаёт —
   * у неё всегда есть якорь «На 100 г» в селекте.
   */
  basisLabel?: string;
  /** Нутриенты, УЖЕ отскейленные под выбранную порцию (карта id → значение). */
  nutrients: NutrientTotalsMap;
  /** Есть ли что показывать в витрине (иначе — пустое состояние с `emptyHint`). */
  hasNutrients: boolean;
  /**
   * Данные ещё грузятся из Dexie (ghost-тик). Пока `true` И нутриентов нет — НЕ
   * показываем пустую подсказку: для непустой сущности это ложь на один тик
   * (мигает, потом появляется витрина). Держим тихий ghost.
   */
  loading?: boolean;
  /**
   * Имена продуктов/блюд без нутриентных данных (сумма дня/блюда считается без
   * них) — тихая сноска под витриной, чтобы выпавшие ккал/БЖУ не исчезали молча.
   */
  missingNutrientNames?: string[];
  /**
   * Подсказка пустого состояния (нет нутриентов и не loading). Дефолт — про
   * страницу сущности; read-only витрины передают свою нейтральную.
   */
  emptyHint?: string;
  /**
   * День расписания (YYYY-MM-DD). Передан → в topRight появляется кнопка
   * матрицы «позиции дня × нутриенты» (NutrientMatrixModal). Не передают
   * витрины сущностей (продукт/блюдо) — у них нет «дня».
   */
  date?: string;
  /**
   * Необязательный футер ПОД витриной (вход в смежную фичу — напр. кнопка
   * «Что доесть?» у дневной витрины). Каркас его не знает и не стилизует:
   * консумер отдаёт готовый узел, витрины сущностей слот не передают.
   */
  footer?: ReactNode;
}

/**
 * Общий каркас нижнего дровера-витрины нутриентов (2026-07-25: слияние быстрого
 * QuickViewDrawer и бокового NutrientsDrawer в одну bottom-sheet витрину).
 * Консумеры — тонкие адаптеры/обёртки: ProductDrawer и DishDrawer (тот же slice)
 * отдают имя, маршрут страницы, пункты селекта порции и отскейленные нутриенты;
 * NutrientsDrawer (widgets) — сумму дня/блюда без базиса и кнопки страницы.
 * Рендер один — витрина `NutrientTotals` из entities/nutrient.
 *
 * Шапка: центрированный title среднего рунга (`titleSize="title"`) — он же
 * `Drawer.Title` (h2 = accessible name), под ним тихий subtitle-контекст (канон
 * `subtitle` DrawerLayout) — он именует витрину, поэтому отдельного заголовка
 * «Нутриенты» в теле нет. Кнопка «уйти на страницу» (глиф ↗ в topRight, 44px,
 * зеркалит крест закрытия) — только когда передан `pageRoute`. Контрол нормы —
 * чип-легенда `NormLegendButton` внутри витрины, в ячейке «норма» шапки колонок
 * микро-групп (слот `normControl` NutrientTotals).
 *
 * Две фазы высоты задаются НЕ здесь, а опциями `QUICK_VIEW_DRAWER_OPTIONS` на
 * call-site; дровер лишь раскладывается по натуральной высоте контента.
 */
export function NutrientShowcaseDrawer({
  title,
  subtitle,
  pageRoute,
  heroName,
  portionOptions,
  selectedPortion,
  onSelectPortion,
  nutrients,
  hasNutrients,
  basisLabel,
  loading,
  missingNutrientNames,
  emptyHint = 'Добавить нутриенты можно на странице',
  date,
  footer,
  onClose,
}: NutrientShowcaseDrawerProps) {
  const { t } = useTranslation();
  const displayName = capitalizeFirst(title);

  // Прогрев lazy-чанка целевой страницы сразу при открытии дровера: клик
  // «Открыть страницу» — VT-навигация, а саспенд на холодном чанке внутри
  // VT update callback обрывает переход (4s paused-rendering budget в Blink).
  useEffect(() => {
    if (pageRoute) preloadRoute(pageRoute);
  }, [pageRoute]);

  // Контрол базиса (2026-07-25, запрос): у еды — селект порции, у супплемента —
  // тихий статичный бейдж (нет граммовых опор → менять нечего, но базис показать
  // надо), у read-only витрины дня/блюда — ничего. Когда витрина смонтирована,
  // контрол уезжает В НЕЁ — ребёнком в правый слот «в т.ч.»-футера (subRow
  // NutrientTotals), рядом с числами, которые он скейлит. В пустом/loading
  // состоянии витрины нет — контрол остаётся соло-рядом по центру над
  // подсказкой/скелетоном (.basisRow). Голос второстепенный — селект приглушён
  // (см. .portionSelect).
  const basisControl =
    portionOptions != null && portionOptions.length > 0 ? (
      <Select
        ariaLabel="Порция"
        variant="inline"
        numeric
        lowercase
        className={s.portionSelect}
        value={selectedPortion ?? ''}
        options={portionOptions}
        onChange={onSelectPortion ?? (() => {})}
      />
    ) : basisLabel ? (
      <Text as="span" role="caption" className={s.basisBadge}>
        {basisLabel}
      </Text>
    ) : undefined;
  // Та же раскадровка 'push', что и переход из FoodActionCard: страница въезжает
  // справа, state.heroName показывает имя сразу. Хук безусловный (rules-of-hooks),
  // но без pageRoute навигация невозможна — кнопки просто нет.
  const goToPage = useViewTransitionNavigate(pageRoute ?? '/', 'push', { state: { heroName } });
  const { getValue } = useNutrientTotals(nutrients);

  // Дровер живёт в стеке drawerStore ПОВЕРХ роутинга — перед навигацией
  // закрываем его явно, иначе остался бы висеть над новой страницей.
  const handleOpenPage = () => {
    onClose();
    goToPage();
  };

  return (
    <DrawerLayout
      header={{ kind: 'compact', title: displayName, subtitle }}
      topRight={
        date || pageRoute ? (
          <>
            {date && (
              // Матрица «позиции дня × нутриенты» (2026-07-31, прототип): тот же
              // topRight-слот и тон `soft`, что у кнопки страницы. Кнопка объявлена
              // здесь же — отдельного компонента нет. Рендерится только когда день
              // передан (витрины сущностей date не передают).
              <span className={s.pageLink}>
                <IconButton
                  className={s.pageLinkBtn}
                  tone="soft"
                  size={44}
                  onClick={() => void modalStore.show(NutrientMatrixModal, { date })}
                  aria-label={t('nutrientMatrix.open', 'Матрица: продукты × нутриенты')}
                  icon={<ListIcon width={24} height={24} />}
                />
              </span>
            )}
            {pageRoute && (
              // Кнопка «уйти на страницу»: глиф ↗ (OpenPageGlyph — понятнее тихого
              // шеврона, что это ПЕРЕХОД на страницу, а не «следующий шаг»). Тон `soft`
              // — покойная ink-подложка (запрос 2026-07-25: голый ghost-глиф терялся
              // без опоры). 44 тап-арея (= --sys-size-control); справа выравнивание по
              // КРОМКЕ плитки (слева — по глифу креста), глиф центрирован в плитке.
              // Глиф — явные 24×24 на самом svg (а не named-size): на номинале
              // chrome(16) стрелка оптически проигрывала плотному кресту.
              <span className={s.pageLink}>
                <IconButton
                  className={s.pageLinkBtn}
                  tone="soft"
                  size={44}
                  onClick={handleOpenPage}
                  aria-label={`Открыть страницу: ${displayName}`}
                  icon={<OpenPageGlyph width={24} height={24} />}
                />
              </span>
            )}
          </>
        ) : undefined
      }
      // Хват-пилюля на верхней кромке убрана (запрос 2026-07-29 — «уродует»):
      // драг листа между фазами работает и без неё, клавиатурный тап-путь — крест.
      hideGrabHandle
    >
      <div className={s.body}>
        {/* Витрина нутриентов (2026-07-25): hero-ведомость макро — 6 боксов
            сеткой 3×2 (Энергия · Вода · Клетчатка / Белки · Жиры · Углеводы) +
            тихий «в т.ч.»-футер (сахар) с контролом базиса справа (children),
            ниже — все микро-группы плотными таблицами (шапка «<группа>,
            содержание | норма», ряды с ячейкой нормы и inCell-треком). Пусто →
            контрол базиса соло-рядом по центру + подсказка на месте витрины,
            без схлопывания. Пока данные грузятся (loading) — тихий ghost, не
            мигаем подсказкой. */}
        {hasNutrients ? (
          <NutrientTotals
            getValue={getValue}
            // Чип нормы объясняет «%» и ведёт к модалке нормы — в ячейке «норма»
            // шапки колонок микро-групп, на месте немой подписи (слот normControl:
            // витрина — entities, кнопка — features, FSD не пускает прямой импорт).
            normControl={<NormLegendButton className={s.normLegend} />}
          >
            {basisControl}
          </NutrientTotals>
        ) : (
          <>
            {/* Пустое/loading состояние: витрины нет → контрол базиса остаётся
                соло-рядом по центру (прежний .basisRow). */}
            {basisControl && <div className={s.basisRow}>{basisControl}</div>}
            {loading ? (
              // Тик Dexie до подгрузки строки: держим ВЫСОТУ скелетоном, зеркалящим
              // витрину (hero-сетка боксов 3×2 + пара рядов хвоста), чтобы лист не
              // открывался почти пустым и не прыгал, когда приедут меры.
              <div className={s.skeleton} aria-hidden="true">
                <div className={s.skeletonHero}>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <span className={s.skeletonRow} />
                <span className={s.skeletonRow} />
              </div>
            ) : (
              <Text as="p" role="body" className={s.emptyHint}>
                {emptyHint}
              </Text>
            )}
          </>
        )}
        {/* Сноска о позициях без нутриентных данных — ВНЕ бранча hasNutrients:
            сумма дня из одних «пустых» продуктов даёт totals={} (витрины нет),
            но имена выпавших показать всё равно надо. */}
        {missingNutrientNames != null && missingNutrientNames.length > 0 && (
          <Text role="caption" className={s.missing}>
            Нет данных о нутриентах: {missingNutrientNames.join(', ')}
          </Text>
        )}
        {footer}
      </div>
    </DrawerLayout>
  );
}

export default NutrientShowcaseDrawer;
