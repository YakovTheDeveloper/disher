import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { Drawer } from '@base-ui/react/drawer';
import { DrawerSideProvider, DrawerSnapProvider } from '@/shared/ui/DrawerLayout';
import type { ResolvedDrawerOptions } from '@/shared/ui/overlay-types';
import type { SelectOption } from '@/shared/ui/atoms/Select';
import { nutrientDisplayGroups, allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { db } from '@/shared/lib/dexie/schema';
import { putRow } from '@/shared/lib/dexie/write';
import { USER_NORM_ID } from '@/entities/daily-norm/model/default-norm';
import { NutrientShowcaseDrawer, QUICK_VIEW_SNAP_POINTS } from './NutrientShowcaseDrawer';

// ─── Демо-данные ───────────────────────────────────────────────────────────────
// nutrients/норма ключуются по РЕАЛЬНОМУ id нутриента, поэтому берём id из боевых
// констант `nutrientDisplayGroups` (тот же источник, что NutrientTotals) — не
// хардкодим строковые id, чтобы стори не рассыпалась при их переименовании.
const mainGroup = nutrientDisplayGroups[0];
const nutrientId = (name: string): string =>
  mainGroup.content.find((n) => n.name === name)?.id ?? name;

// «Алыча», на 100 г — заполняет энергию + Б/Ж/У + клетчатку/сахар/воду, чтобы
// витрина показала полный стек, а не пустой скелет.
const DEMO_NUTRIENTS: Record<string, number> = {
  [nutrientId('energy')]: 46,
  [nutrientId('protein')]: 0.5,
  [nutrientId('fats')]: 0.3,
  [nutrientId('carbohydrates')]: 11,
  [nutrientId('fiber')]: 1.5,
  [nutrientId('sugar')]: 9.9,
  [nutrientId('water')]: 87,
};

// id нутриента ЛЮБОЙ группы (минералы/витамины тоже) — для «жирного» датасета.
const anyNutrientId = (name: string): string =>
  allNutrientsList.find((n) => n.name === name)?.id ?? name;

// «Жирный» датасет (2026-07-24, критика табличного дизайна) — стресс-тест колонок:
// 4-значная энергия (порция 300 г), 5-значный натрий (соль), витамин A с pctRaw за
// капом 999 (печень), длинное имя («Пантотеновая кислота» — усечение многоточием)
// и нули (витамин D — приглушённая строка «0 %»). Проверяет, что числа не
// переливаются через вертикальные hairline сетки.
const DENSE_NUTRIENTS: Record<string, number> = {
  [anyNutrientId('energy')]: 1850,
  [anyNutrientId('protein')]: 58,
  [anyNutrientId('fats')]: 122,
  [anyNutrientId('carbohydrates')]: 3.6,
  [anyNutrientId('fiber')]: 0,
  [anyNutrientId('sugar')]: 1.2,
  [anyNutrientId('water')]: 210,
  [anyNutrientId('sodium')]: 38758,
  [anyNutrientId('potassium')]: 3500,
  [anyNutrientId('vitaminA')]: 9000,
  [anyNutrientId('vitaminB5')]: 7,
  [anyNutrientId('vitaminD')]: 0,
};

// Демо-норма — чтобы `NormLegendButton` показал состояние «норма задана» и у рядов
// появилась колонка «% доли». Сеется в Dexie loader'ом ниже (Storybook в браузере
// ⇒ IndexedDB настоящий, fake-indexeddb не нужен).
const DEMO_NORM: Record<string, number> = {
  [nutrientId('energy')]: 2000,
  [nutrientId('protein')]: 75,
  [nutrientId('fats')]: 60,
  [nutrientId('carbohydrates')]: 250,
};

const DEMO_PORTIONS: SelectOption[] = [
  { value: '100', label: 'На 100 г' },
  { value: '150', label: 'Порция 150 г' },
  { value: '30', label: '1 шт · 30 г' },
];

// ─── Швартовка дровера ──────────────────────────────────────────────────────────
// NutrientShowcaseDrawer → DrawerLayout рендерит `Drawer.Popup` и читает snap/side-контекст,
// поэтому в изоляции нужен тот же каркас, что в DrawerManager: Root → Portal →
// Viewport → Side/Snap-провайдеры. Отличия от прода — намеренные, чтобы лист стоял
// СТАТИЧНОЙ панелью для чистого снимка story.to.design, а не парящим fixed-оверлеем:
//   · modal={false} + без Backdrop — нет скрима и scroll-lock'а;
//   · портал в локальный фрейм-див (position:relative) — лист живёт внутри канвы;
//   · scoped-CSS переводит `#drawer-content` (стабильный id от DrawerLayout) в
//     position:relative + transform:none + max-height:none ⇒ попап встаёт в
//     нормальный поток, фрейм обнимает его целиком, весь контент виден без скролла.
const DRAWER_OPTS: ResolvedDrawerOptions = {
  side: 'bottom',
  snapPoints: QUICK_VIEW_SNAP_POINTS,
  defaultSnapPoint: QUICK_VIEW_SNAP_POINTS[0],
};

type StoryArgs = {
  title: string;
  subtitle: string;
  heroName?: string;
  hasNutrients: boolean;
  loading?: boolean;
  basisLabel?: string;
  /** Read-only витрина дня/блюда: без pageRoute и контрола базиса. */
  readOnly?: boolean;
  /** Сноска о позициях без нутриентных данных (сумма дня). */
  missingNutrientNames?: string[];
  /** «Жирный» датасет (стресс-тест колонок) вместо демо-алычи. */
  denseData?: boolean;
};

// Пришвартованная сцена: фрейм + каркас Base UI Drawer + сам NutrientShowcaseDrawer.
// Держит локальный selectedPortion (селект контролируемый) и достраивает пропы,
// которые в бою даёт адаптер (portionOptions/nutrients/pageRoute). basisLabel-стори
// (супплемент) отдаёт пустой portionOptions ⇒ показывается тихий бейдж базиса.
// ЖИВЁТ как element data-роутера (ниже): useViewTransitionNavigate → RR7
// `useViewTransitionState` требует ИМЕННО data router (createMemoryRouter), а не
// компонентный <MemoryRouter> — иначе invariant-краш.
function DrawerStage(args: StoryArgs) {
  const [portion, setPortion] = useState('100');
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const isSupplement = !!args.basisLabel;
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        background: 'var(--sys-color-surface-2, #ece7de)',
      }}
    >
      <div
        ref={setFrame}
        className="sb-drawer-frame"
        style={{
          position: 'relative',
          width: 390,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.16)',
        }}
      >
        {frame && (
          <Drawer.Root
            open
            modal={false}
            snapPoints={QUICK_VIEW_SNAP_POINTS}
            snapPoint={QUICK_VIEW_SNAP_POINTS[0]}
          >
            <Drawer.Portal container={frame}>
              <Drawer.Viewport className="sb-viewport">
                <DrawerSideProvider value={DRAWER_OPTS}>
                  <DrawerSnapProvider
                    value={{ atTopSnap: true, canExpand: true, toggleSnap: () => {} }}
                  >
                    <NutrientShowcaseDrawer
                      title={args.title}
                      subtitle={args.subtitle}
                      heroName={args.heroName}
                      pageRoute={args.readOnly ? undefined : '#'}
                      basisLabel={args.basisLabel}
                      portionOptions={
                        args.readOnly ? undefined : isSupplement ? [] : DEMO_PORTIONS
                      }
                      selectedPortion={portion}
                      onSelectPortion={setPortion}
                      nutrients={
                        args.hasNutrients ? (args.denseData ? DENSE_NUTRIENTS : DEMO_NUTRIENTS) : {}
                      }
                      hasNutrients={args.hasNutrients}
                      loading={args.loading}
                      missingNutrientNames={args.missingNutrientNames}
                      emptyHint={args.readOnly ? 'Нет данных о нутриентах' : undefined}
                      onClose={() => {}}
                    />
                  </DrawerSnapProvider>
                </DrawerSideProvider>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.Root>
        )}
      </div>
      <style>{`
        .sb-viewport { position: static !important; }
        .sb-drawer-frame #drawer-content {
          position: relative !important;
          transform: none !important;
          max-height: none !important;
        }
      `}</style>
    </div>
  );
}

function NutrientShowcaseDrawerDemo(args: StoryArgs) {
  // Data router (не компонентный <MemoryRouter>): RR7 useViewTransitionState жив
  // только под data router'ом. portion-стейт живёт ВНУТРИ DrawerStage (routed
  // element), поэтому выбор порции не пересобирает роутер — только args-смена.
  const router = useMemo(
    () =>
      createMemoryRouter([{ path: '*', element: <DrawerStage {...args} /> }], {
        initialEntries: ['/'],
      }),
    [args],
  );
  return <RouterProvider router={router} />;
}

const meta: Meta<StoryArgs> = {
  title: 'Food/NutrientShowcaseDrawer',
  render: (args) => <NutrientShowcaseDrawerDemo {...args} />,
  // Сеем демо-норму в Dexie ДО рендера (loader await'ится) — иначе на первом тике
  // useLiveQuery чип нормы отрисуется как «не задана». putRow (контракт записи), а
  // не сырой db.put — тот забанен линтом вне write.ts.
  loaders: [
    async () => {
      await putRow(db.daily_norms, {
        id: USER_NORM_ID,
        name: 'Демо-норма',
        description: '',
        items: DEMO_NORM,
        created_at: new Date().toISOString(),
      });
      return {};
    },
  ],
  args: {
    title: 'алыча',
    subtitle: 'Пищевая ценность',
    heroName: 'Алыча',
    hasNutrients: true,
    loading: false,
  },
  argTypes: {
    basisLabel: { control: 'text' },
    title: { control: 'text' },
    subtitle: { control: 'text' },
    hasNutrients: { control: 'boolean' },
    loading: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    denseData: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Продукт — арка вида «продукт» над кнопкой перехода, селект порции слева. */
export const Product: Story = {};

/** «Жирный» датасет — стресс-тест витрины: 4-значная энергия, 5-значный
    натрий, % за капом 999, длинное имя с многоточием, нулевой витамин D. */
export const DenseData: Story = {
  args: { title: 'гусиная печень', heroName: 'Гусиная печень', denseData: true },
};

/** Блюдо — тот же каркас, другая сущность (cornerLabel-дуга снята 2026-07-25). */
export const Dish: Story = {
  args: { title: 'борщ', heroName: 'Борщ' },
};

/** Супплемент — нет граммовых опор: вместо селекта тихий бейдж базиса «за порцию». */
export const Supplement: Story = {
  args: { title: 'омега-3', heroName: 'Омега-3', basisLabel: 'за порцию' },
};

/** Пусто — нутриентов нет: подсказка «Добавить нутриенты можно на странице». */
export const Empty: Story = {
  args: { hasNutrients: false, loading: false },
};

/** День из расписания — read-only витрина: без кнопки страницы и базиса,
    подзаголовок «За весь день», сноска о позициях без данных. */
export const DayTotal: Story = {
  args: {
    title: 'Нутриенты',
    subtitle: 'За весь день',
    heroName: undefined,
    readOnly: true,
    missingNutrientNames: ['хлеб домашний', 'компот'],
  },
};

/** Загрузка — ghost-скелетон, зеркалящий стек витрины (тик Dexie до подгрузки). */
export const Loading: Story = {
  args: { hasNutrients: false, loading: true },
};
