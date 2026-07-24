import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { NormLegendButton } from '@/features/dailyNorms/NormLegendButton';
import { NutrientDenseView } from '@/entities/nutrient/ui/NutrientDenseView';
import { OpenPageGlyph } from '@/shared/ui/atoms/OpenPageGlyph';
import { ArcLabel } from '@/shared/ui/ArcLabel/ArcLabel';
import { IconButton } from '@/shared/ui/atoms/Button';
import { Select, type SelectOption } from '@/shared/ui/atoms/Select';
import { Text } from '@/shared/ui/atoms/Typography';
import { type QuickViewKind } from './entityKind';
import { useViewTransitionNavigate } from '@/shared/lib/viewTransition';
import { useNutrientTotals } from '@/shared/lib/useNutrientTotals';
import { capitalizeFirst } from '@/shared/lib/text/capitalizeFirst';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import type { DrawerOptions } from '@/shared/ui/overlay-types';
import type { BaseDrawerProps } from '@/shared/ui';
import s from './QuickViewDrawer.module.scss';

/**
 * Snap-высоты нижнего дровера быстрого просмотра — общие для ВСЕХ адаптеров
 * (ProductDrawer/DishDrawer), поэтому объявлены здесь, а не на каждом call-site:
 * так фазы не разъедутся между сущностями. Значения — доли высоты вьюпорта
 * (грамматика Base UI: 0..1 = доля, >1 = px, строка = CSS-длина).
 *
 *  - фаза-1 `0.62` — открывающая высота. Порядок контента (шапка с именем →
 *    ряд базиса с селектом → базовая группа БЖУ) выводит самое важное наверх.
 *    ⚠️ 2026-07-24: базовая группа стала последовательным стеком (энергия строкой →
 *    Б → Ж → У → ряд клетчатка|сахар → вода) — это ~6 рядов вместо прежних 4, то есть
 *    заметно ВЫШЕ. На низких экранах хвост стека (вода + легенда нормы) может уходить
 *    под сгиб 0.62; фаза-2 (0.92) его открывает перетаскиванием. Если тесно — поднять
 *    defaultSnapPoint. Внутренний скролл на этой фазе НЕ включён — низкие группы
 *    (минералы/витамины/аминокислоты) открываются перетаскиванием вверх.
 *  - фаза-2 `0.92` — почти во весь экран: весь контент уже смонтирован, здесь
 *    лишь больше места под внутренний скролл.
 */
export const QUICK_VIEW_SNAP_POINTS: (number | string)[] = [0.62, 0.92];

/**
 * Готовые опции `drawerStore.show(...)` для быстрого просмотра — адаптеры
 * открываются ОДНИМ и тем же объектом, поэтому side/snap не могут разойтись:
 * `drawerStore.show(ProductDrawer, { productId }, QUICK_VIEW_DRAWER_OPTIONS)`.
 */
export const QUICK_VIEW_DRAWER_OPTIONS = {
  side: 'bottom',
  snapPoints: QUICK_VIEW_SNAP_POINTS,
  defaultSnapPoint: QUICK_VIEW_SNAP_POINTS[0],
} satisfies DrawerOptions;

interface QuickViewDrawerProps extends BaseDrawerProps {
  /** Имя сущности — заголовок шапки (капитализируется тут). */
  title: string;
  /**
   * Какая из сущностей открыта. Питает декоративную дугу вида в шапке
   * («продукт»/«блюдо», ArcLabel над кнопкой перехода): dish → «блюдо» (долина вниз),
   * product/my-product → «продукт» (арка вверх).
   */
  kind: QuickViewKind;
  /** Готовый URL страницы сущности («Открыть страницу» → сюда). */
  pageRoute: string;
  /** Имя для мгновенной шапки страницы (едет в nav-state). */
  heroName?: string;
  /** Пункты селекта порции/количества (адаптер строит под сущность). */
  portionOptions: SelectOption[];
  /** value выбранного пункта селекта. */
  selectedPortion: string;
  onSelectPortion: (value: string) => void;
  /**
   * Когда `portionOptions` пуст (супплемент/БАД — нет граммовых опор), базис чисел
   * не самоочевиден. Тихий статичный бейдж («за порцию») в ряду-заголовке БЖУ
   * говорит, НА ЧТО приведены значения, без интерактива. Еда его не передаёт —
   * у неё всегда есть якорь «На 100 г» в селекте.
   */
  basisLabel?: string;
  /** Нутриенты, УЖЕ отскейленные под выбранную порцию (карта id → значение). */
  nutrients: NutrientTotals;
  /** Есть ли что показывать в мере (иначе — подсказка про страницу). */
  hasNutrients: boolean;
  /**
   * Данные ещё грузятся из Dexie (ghost-тик). Пока `true` И нутриентов нет — НЕ
   * показываем подсказку «нет нутриентов»: для непустой сущности это ложь на один
   * тик (мигает «Добавить на странице», потом появляется метр). Держим тихий
   * ghost. Опционально: адаптер без loading-сигнала (ProductDrawer сам гейтит
   * ghost через `!!food`) его не передаёт — тогда поведение прежнее.
   */
  loading?: boolean;
}

/**
 * Общий каркас нижнего дровера быстрого просмотра нутриентов. ProductDrawer и
 * DishDrawer — тонкие адаптеры над ним: отдают имя/kind, маршрут страницы,
 * пункты селекта порции и отскейленные нутриенты. Всё редактирование живёт на
 * странице сущности — туда ведёт глиф › в topRight-слоте chrome-ряда (44px,
 * зеркалит крест закрытия — симметрия грида не ломается).
 * Шапка дровера (2026-07-23): центрированный title среднего рунга
 * (`titleSize="title"`) несёт ИМЯ сущности («Алыча») — оно же `Drawer.Title`
 * (h2 = accessible name), а под ним тихий subtitle-контекст «Пищевая ценность»
 * (канон `subtitle` DrawerLayout) — он же именует витрину, поэтому отдельного
 * заголовка «Нутриенты» в теле нет. Тело открывает приглушённый контрол базиса,
 * прибитый вправо (селект порции у еды, тихий бейдж у супплемента; числа-опоры
 * через примитив Numeral). Контрол нормы — чип-легенда `NormLegendButton` под
 * плитками, вплотную к процентам.
 *
 * Две фазы высоты задаются НЕ здесь, а опциями `QUICK_VIEW_DRAWER_OPTIONS` на
 * call-site адаптера; дровер лишь раскладывается по натуральной высоте контента.
 */
export function QuickViewDrawer({
  title,
  kind,
  pageRoute,
  heroName,
  portionOptions,
  selectedPortion,
  onSelectPortion,
  nutrients,
  hasNutrients,
  basisLabel,
  loading,
  onClose,
}: QuickViewDrawerProps) {
  const displayName = capitalizeFirst(title);
  // Подзаголовок шапки — что показываем. «Пищевая ценность» одинаков для продукта и
  // блюда: имя несёт заголовок, подзаголовок именует витрину (заголовок «Нутриенты»
  // в теле поэтому убран).
  const subtitle = 'Пищевая ценность';

  // Контрол базиса, стоящий СЛЕВА в ряду базиса (2026-07-24, запрос — селект уехал
  // влево, чип нормы занял его прежнее место справа): селект порции у еды, тихий
  // статичный бейдж базиса у супплемента (нет граммовых опор → менять нечего, но
  // базис показать надо). Голос второстепенный — селект приглушён (см. .portionSelect).
  const basisControl =
    portionOptions.length > 0 ? (
      <Select
        ariaLabel="Порция"
        variant="inline"
        numeric
        lowercase
        className={s.portionSelect}
        value={selectedPortion}
        options={portionOptions}
        onChange={onSelectPortion}
      />
    ) : basisLabel ? (
      <Text as="span" role="caption" className={s.basisBadge}>
        {basisLabel}
      </Text>
    ) : undefined;
  // Та же раскадровка 'push', что и переход из FoodActionCard: страница въезжает
  // справа, state.heroName показывает имя сразу.
  const goToPage = useViewTransitionNavigate(pageRoute, 'push', { state: { heroName } });
  const { getValue } = useNutrientTotals(nutrients);

  // Дровер живёт в стеке drawerStore ПОВЕРХ роутинга — перед навигацией
  // закрываем его явно, иначе остался бы висеть над новой страницей.
  const handleOpenPage = () => {
    onClose();
    goToPage();
  };

  return (
    <DrawerLayout
      title={displayName}
      titleSize="title"
      subtitle={subtitle}
      topRight={
        // Кнопка «уйти на страницу»: глиф ↗ (OpenPageGlyph — понятнее тихого шеврона,
        // что это ПЕРЕХОД на страницу, а не «следующий шаг»). Над ней декоративная дуга
        // вида «продукт»/«блюдо» (ArcLabel — тот же штемпель-паттерн, что в «Мое»
        // SearchFood): продукт — арка вверх, блюдо — долина вниз; тихий tertiary-цвет,
        // некричаще. Обёртка position:relative даёт дуге якорь, чтобы она огибала иконку
        // сверху у самой кромки. 44 тап-арея (= --sys-size-control), глиф 14 —
        // унифицирован с ведущим крестом; право-джастификация глифа (.pageLinkBtn)
        // зеркалит крест слева.
        <span className={s.pageLink}>
          <ArcLabel
            text={kind === 'dish' ? 'блюдо' : 'продукт'}
            flip={kind === 'dish'}
            // Крутой выгиб (радиус 54 вместо пологого 70) — «арка над иконкой» в духе
            // 90–135°; хорда та же, дуга бугрится выше. Точную кривизну легко дожать
            // радиусом.
            radius={54}
            className={s.kindArc}
          />
          <IconButton
            className={s.pageLinkBtn}
            tone="ghost"
            size={44}
            onClick={handleOpenPage}
            aria-label={`Открыть страницу: ${displayName}`}
            // Глиф на токен-шкале (chrome = 16, тот же, что ведущий крест) вместо
            // прежних хардкод-14: named-size вместо изобретённого px.
            icon={<OpenPageGlyph size="chrome" />}
          />
        </span>
      }
      surface={1}
    >
      <div className={s.body}>
        {/* Ряд базиса (2026-07-24, запрос): селект порции/бейдж СЛЕВА, чип нормы —
            СПРАВА (на бывшем месте селекта). Чип нормы объясняет «%» и ведёт к модалке
            нормы; показываем его только когда есть что объяснять (hasNutrients). Сам
            чип ещё и самогейтит видимость по норме. */}
        {(basisControl || hasNutrients) && (
          <div className={s.basisRow}>
            {basisControl}
            {hasNutrients && <NormLegendButton className={s.normLegend} />}
          </div>
        )}

        {/* Плотная витрина нутриентов: последовательный стек — энергия строкой сверху,
            затем Б/Ж/У построчно, ряд клетчатка|сахар пополам, вода строкой снизу;
            группы отбиты границей. Пусто → подсказка на месте меры, без схлопывания.
            Пока данные грузятся (loading) — тихий ghost, не мигаем подсказкой. */}
        {hasNutrients ? (
          <NutrientDenseView getValue={getValue} />
        ) : loading ? (
          // Тик Dexie до подгрузки строки: держим ВЫСОТУ скелетоном, зеркалящим
          // стек витрины (энергия + Б/Ж/У + клетчатка/сахар + вода),
          // чтобы лист не открывался почти пустым и не прыгал, когда приедут меры.
          <div className={s.skeleton} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : (
          <Text as="p" role="body" className={s.emptyHint}>
            Добавить нутриенты можно на странице
          </Text>
        )}
      </div>
    </DrawerLayout>
  );
}

export default QuickViewDrawer;
